import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest } from '../types';

export const applyAsVendor = async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    storeName: z.string().min(2),
    storeSlug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),
    description: z.string().optional(),
    phone: z.string().optional(),
  });
  const body = schema.parse(req.body);

  const existing = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } });
  if (existing) {
    sendError(res, 'You already have a vendor profile', 409);
    return;
  }

  const slugTaken = await prisma.vendor.findUnique({ where: { storeSlug: body.storeSlug } });
  if (slugTaken) {
    sendError(res, 'Store slug is already taken', 409);
    return;
  }

  const [vendor] = await prisma.$transaction([
    prisma.vendor.create({
      data: { ...body, userId: req.user!.userId, status: 'PENDING' },
    }),
    prisma.user.update({
      where: { id: req.user!.userId },
      data: { role: 'VENDOR' },
    }),
  ]);

  sendSuccess(res, vendor, 'Vendor application submitted. Awaiting admin approval.', 201);
};

export const getMyVendorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const vendor = await prisma.vendor.findUnique({
    where: { userId: req.user!.userId },
    include: { _count: { select: { products: true, orders: true } } },
  });
  if (!vendor) {
    sendError(res, 'Vendor profile not found', 404);
    return;
  }
  sendSuccess(res, vendor);
};

export const updateVendorProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    storeName: z.string().min(2).optional(),
    description: z.string().optional(),
    phone: z.string().optional(),
    logo: z.string().url().optional(),
  });
  const body = schema.parse(req.body);
  const vendor = await prisma.vendor.update({ where: { userId: req.user!.userId }, data: body });
  sendSuccess(res, vendor, 'Profile updated');
};

export const getVendorProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } });
  if (!vendor) {
    sendError(res, 'Vendor not found', 404);
    return;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where: { vendorId: vendor.id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.product.count({ where: { vendorId: vendor.id } }),
  ]);
  sendPaginated(res, products, total, page, limit);
};

export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2),
    description: z.string().optional(),
    price: z.number().positive(),
    comparePrice: z.number().positive().optional(),
    images: z.array(z.string()).default([]),
    categoryId: z.string(),
    stock: z.number().int().nonnegative().default(0),
    unit: z.string().default('piece'),
    discount: z.number().min(0).max(100).default(0),
    tags: z.array(z.string()).default([]),
    isFeatured: z.boolean().default(false),
    isTrending: z.boolean().default(false),
  });
  const body = schema.parse(req.body);

  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } });
  if (!vendor) {
    sendError(res, 'Vendor not found', 404);
    return;
  }

  const product = await prisma.product.create({ data: { ...body, vendorId: vendor.id } });
  sendSuccess(res, product, 'Product created', 201);
};

export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    comparePrice: z.number().positive().nullable().optional(),
    images: z.array(z.string()).optional(),
    stock: z.number().int().nonnegative().optional(),
    discount: z.number().min(0).max(100).optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isTrending: z.boolean().optional(),
    tags: z.array(z.string()).optional(),
  });
  const body = schema.parse(req.body);

  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } });
  if (!vendor) {
    sendError(res, 'Vendor not found', 404);
    return;
  }

  const product = await prisma.product.updateMany({ where: { id: req.params.id, vendorId: vendor.id }, data: body });
  if (product.count === 0) {
    sendError(res, 'Product not found', 404);
    return;
  }
  sendSuccess(res, null, 'Product updated');
};

export const getVendorOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 20;
  const skip = (page - 1) * limit;

  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } });
  if (!vendor) {
    sendError(res, 'Vendor not found', 404);
    return;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { vendorId: vendor.id },
      include: { user: { select: { name: true, phone: true } }, items: true, address: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { vendorId: vendor.id } }),
  ]);
  sendPaginated(res, orders, total, page, limit);
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = z.object({ status: z.enum(['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP']) }).parse(req.body);

  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } });
  if (!vendor) {
    sendError(res, 'Vendor not found', 404);
    return;
  }

  const order = await prisma.order.updateMany({
    where: { id: req.params.id, vendorId: vendor.id },
    data: {
      status,
      trackingHistory: {
        push: { status, message: `Order ${status.toLowerCase().replace(/_/g, ' ')}`, timestamp: new Date() },
      },
    },
  });
  if (order.count === 0) {
    sendError(res, 'Order not found', 404);
    return;
  }
  sendSuccess(res, null, 'Order status updated');
};

export const getVendorDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user!.userId } });
  if (!vendor) {
    sendError(res, 'Vendor not found', 404);
    return;
  }

  const [totalOrders, pendingOrders, totalRevenue, totalProducts, lowStock] = await Promise.all([
    prisma.order.count({ where: { vendorId: vendor.id } }),
    prisma.order.count({ where: { vendorId: vendor.id, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } }),
    prisma.order.aggregate({ where: { vendorId: vendor.id, status: 'DELIVERED' }, _sum: { total: true } }),
    prisma.product.count({ where: { vendorId: vendor.id } }),
    prisma.product.count({ where: { vendorId: vendor.id, stock: { lt: 10 } } }),
  ]);

  sendSuccess(res, {
    totalOrders,
    pendingOrders,
    totalRevenue: totalRevenue._sum.total || 0,
    totalProducts,
    lowStockProducts: lowStock,
  });
};
