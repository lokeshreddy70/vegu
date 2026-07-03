import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest, ProductQuery } from '../types';

const buildBazaarSnapshot = async () => {
  const productSelect = {
    id: true, name: true, slug: true, price: true, comparePrice: true,
    images: true, unit: true, stock: true, discount: true,
    rating: true, reviewCount: true, createdAt: true,
    category: { select: { name: true, slug: true } },
  };

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [freshArrivals, lowStock, trending] = await Promise.all([
    prisma.product.findMany({
      where: { isAvailable: true, stock: { gt: 0 }, createdAt: { gte: sevenDaysAgo } },
      select: productSelect,
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.product.findMany({
      where: { isAvailable: true, stock: { gt: 0, lte: 20 } },
      select: productSelect,
      orderBy: { stock: 'asc' },
      take: 10,
    }),
    prisma.product.findMany({
      where: { isAvailable: true, stock: { gt: 0 }, isTrending: true },
      select: productSelect,
      orderBy: { reviewCount: 'desc' },
      take: 10,
    }),
  ]);

  return { freshArrivals, lowStock, trending };
};

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const q = req.query as ProductQuery;
  const page = Math.max(1, parseInt(q.page || '1') || 1);
  const limit = Math.min(Math.max(1, parseInt(q.limit || '20') || 20), 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isAvailable: true };
  if (q.category) where.category = { slug: q.category };
  if (q.featured === 'true') where.isFeatured = true;
  if (q.trending === 'true') where.isTrending = true;
  if (q.vendorId) where.vendorId = q.vendorId;
  if (q.search) {
    where.OR = [
      { name: { contains: q.search, mode: 'insensitive' } },
      { description: { contains: q.search, mode: 'insensitive' } },
      { tags: { hasSome: [q.search.toLowerCase()] } },
    ];
  }
  if (q.minPrice || q.maxPrice) {
    where.price = {
      ...(q.minPrice && { gte: parseFloat(q.minPrice) }),
      ...(q.maxPrice && { lte: parseFloat(q.maxPrice) }),
    };
  }

  const orderBy: Record<string, string> = {};
  const sortMap: Record<string, string> = { price: 'price', rating: 'rating', newest: 'createdAt', popular: 'reviewCount' };
  if (q.sortBy && sortMap[q.sortBy]) {
    orderBy[sortMap[q.sortBy]] = q.sortOrder || 'desc';
  } else {
    orderBy.createdAt = 'desc';
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: { select: { name: true, slug: true } }, vendor: { select: { storeName: true, storeSlug: true } } },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  sendPaginated(res, products, total, page, limit);
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug, isAvailable: true },
    include: {
      category: { select: { name: true, slug: true, icon: true } },
      vendor: { select: { storeName: true, storeSlug: true, rating: true } },
      reviews: {
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!product) {
    sendError(res, 'Product not found', 404);
    return;
  }
  sendSuccess(res, product);
};

export const getFeaturedProducts = async (_req: Request, res: Response): Promise<void> => {
  const products = await prisma.product.findMany({
    where: { isAvailable: true, isFeatured: true },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { rating: 'desc' },
    take: 12,
  });
  sendSuccess(res, products);
};

export const getTrendingProducts = async (_req: Request, res: Response): Promise<void> => {
  const products = await prisma.product.findMany({
    where: { isAvailable: true, isTrending: true },
    include: { category: { select: { name: true, slug: true } } },
    orderBy: { rating: 'desc' },
    take: 12,
  });
  sendSuccess(res, products);
};

export const getBazaarProducts = async (_req: Request, res: Response): Promise<void> => {
  const data = await buildBazaarSnapshot();
  sendSuccess(res, data);
};

export const streamBazaarProducts = async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendSnapshot = async () => {
    const data = await buildBazaarSnapshot();
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  await sendSnapshot();
  const timer = setInterval(() => {
    void sendSnapshot();
  }, 30000);

  req.on('close', () => {
    clearInterval(timer);
    res.end();
  });
};

export const createReview = async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    rating: z.number().int().min(1).max(5),
    title: z.string().optional(),
    comment: z.string().optional(),
  });
  const body = schema.parse(req.body);
  const { slug } = req.params;

  const product = await prisma.product.findUnique({ where: { slug } });
  if (!product) {
    sendError(res, 'Product not found', 404);
    return;
  }

  const review = await prisma.review.create({
    data: { ...body, userId: req.user!.userId, productId: product.id },
    include: { user: { select: { name: true, avatar: true } } },
  });

  const agg = await prisma.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: true });
  await prisma.product.update({
    where: { id: product.id },
    data: { rating: agg._avg.rating || 0, reviewCount: agg._count },
  });

  sendSuccess(res, review, 'Review submitted', 201);
};
