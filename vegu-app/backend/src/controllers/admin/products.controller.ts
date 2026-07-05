import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const imageInput = z.string().refine((value) => /^(https?:\/\/|data:image\/)/.test(value), 'Image must be an http(s) URL or data image');

const productSchema = z.object({
  name: z.string().min(2).max(200),
  brand: z.string().max(120).optional(),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  comparePrice: z.number().positive().optional(),
  images: z.array(imageInput).default([]),
  categoryId: z.string(),
  vendorId: z.string(),
  sku: z.string().max(100).optional(),
  stock: z.number().int().min(0).default(0),
  minStockAlert: z.number().int().min(0).default(10),
  unit: z.string().default('piece'),
  weight: z.number().positive().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  batchNumber: z.string().max(120).optional(),
  expiryDate: z.string().datetime().optional(),
  discount: z.number().min(0).max(100).default(0),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
  const limit = Math.min(Math.max(1, parseInt(String(req.query.limit || '20')) || 20), 100);
  const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : undefined;

  const where: Record<string, unknown> = {};
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { sku: { contains: search, mode: 'insensitive' } },
  ];
  if (req.query.categoryId) where.categoryId = req.query.categoryId;
  if (req.query.vendorId) where.vendorId = req.query.vendorId;
  if (req.query.featured === 'true') where.isFeatured = true;
  if (req.query.available === 'false') where.isAvailable = false;
  if (req.query.lowStock === 'true') where.stock = { lte: 5 };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, parentId: true } },
        vendor: { select: { id: true, storeName: true, storeSlug: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);
  sendPaginated(res, products, total, page, limit);
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const body = productSchema.parse(req.body);
  const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  const product = await prisma.product.create({ data: { ...body, slug, expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined } });
  sendSuccess(res, product, 'Product created', 201);
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const body = productSchema.partial().parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { ...body, expiryDate: body.expiryDate ? new Date(body.expiryDate) : body.expiryDate === undefined ? undefined : null },
  });
  sendSuccess(res, product, 'Product updated');
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    sendSuccess(res, null, 'Product deleted permanently');
  } catch {
    sendError(res, 'Product is referenced by orders or carts. Hide it instead of deleting.', 400);
  }
};

export const toggleProductAvailability = async (req: Request, res: Response): Promise<void> => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) {
    sendError(res, 'Not found', 404);
    return;
  }
  const updated = await prisma.product.update({ where: { id: req.params.id }, data: { isAvailable: !product.isAvailable } });
  sendSuccess(res, { isAvailable: updated.isAvailable }, updated.isAvailable ? 'Product enabled' : 'Product hidden');
};

export const toggleProductFeatured = async (req: Request, res: Response): Promise<void> => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) { sendError(res, 'Not found', 404); return; }
  const updated = await prisma.product.update({ where: { id: req.params.id }, data: { isFeatured: !product.isFeatured } });
  sendSuccess(res, { isFeatured: updated.isFeatured });
};
