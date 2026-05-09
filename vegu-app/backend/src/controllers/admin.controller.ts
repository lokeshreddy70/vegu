import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

// ── Dashboard ───────────────────────────────────────────────────────────────

export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const [
    totalUsers, totalVendors, totalOrders, totalRevenue,
    pendingVendors, recentOrders,
    todayOrders, todayRevenue, pendingOrders, deliveredToday,
    cancelledOrders, lowStockProducts, recentActivity,
    weeklyRevenue, topProducts,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.vendor.count({ where: { status: 'APPROVED' } }),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }),
    prisma.vendor.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        vendor: { select: { storeName: true } },
        items: { take: 1, include: { product: { select: { name: true, images: true } } } },
      },
    }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.aggregate({ where: { status: 'DELIVERED', deliveredAt: { gte: today } }, _sum: { total: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'DELIVERED', deliveredAt: { gte: today } } }),
    prisma.order.count({ where: { status: 'CANCELLED', createdAt: { gte: monthAgo } } }),
    prisma.product.findMany({ where: { stock: { lte: 5 }, isAvailable: true }, take: 5, select: { id: true, name: true, stock: true, images: true }, orderBy: { stock: 'asc' } }),
    prisma.order.findMany({ take: 10, orderBy: { updatedAt: 'desc' }, select: { id: true, orderNumber: true, status: true, total: true, createdAt: true, updatedAt: true, user: { select: { name: true } } } }),
    // Revenue for last 7 days
    Promise.all(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return prisma.order.aggregate({
        where: { status: 'DELIVERED', deliveredAt: { gte: d, lt: next } },
        _sum: { total: true },
      }).then(r => ({ date: d.toISOString().slice(0, 10), revenue: r._sum.total || 0 }));
    })),
    prisma.orderItem.groupBy({
      by: ['name'],
      _sum: { quantity: true, total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
    }),
  ]);

  const monthOrders = await prisma.order.count({ where: { createdAt: { gte: monthAgo } } });
  const cancellationRate = monthOrders > 0 ? ((cancelledOrders / monthOrders) * 100).toFixed(1) : '0';

  sendSuccess(res, {
    stats: {
      totalUsers, totalVendors, totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingVendors, todayOrders, pendingOrders, deliveredToday,
      todayRevenue: todayRevenue._sum.total || 0,
      cancellationRate,
    },
    recentOrders,
    lowStockProducts,
    recentActivity,
    weeklyRevenue,
    topProducts,
  });
};

// ── Users ───────────────────────────────────────────────────────────────────

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string || '1'));
  const limit = 20;
  const skip = (page - 1) * limit;
  // Limit search string to prevent expensive full-table scans via huge inputs
  const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : undefined;
  const role = req.query.role as string;

  const where: Record<string, unknown> = {};
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ];
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, createdAt: true, avatar: true, loyaltyPoints: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  sendPaginated(res, users, total, page, limit);
};

export const getUserDetail = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      orders: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, orderNumber: true, status: true, total: true, createdAt: true } },
      addresses: true,
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!user) { sendError(res, 'User not found', 404); return; }
  const spending = await prisma.order.aggregate({ where: { userId: req.params.id, status: 'DELIVERED' }, _sum: { total: true } });
  sendSuccess(res, { ...user, totalSpending: spending._sum.total || 0 });
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) { sendError(res, 'User not found', 404); return; }
  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
  sendSuccess(res, { isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
};

// ── Vendors ─────────────────────────────────────────────────────────────────

export const getVendors = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string;
  const search = req.query.search as string;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { storeName: { contains: search, mode: 'insensitive' } },
    { user: { name: { contains: search, mode: 'insensitive' } } },
  ];

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { products: true, orders: true } },
      },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vendor.count({ where }),
  ]);
  sendPaginated(res, vendors, total, page, limit);
};

export const updateVendorStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']) }).parse(req.body);

  // Atomic: vendor status + user role must both succeed or both roll back
  const vendor = await prisma.$transaction(async (tx) => {
    const updated = await tx.vendor.update({
      where: { id: req.params.id },
      data: { status, isActive: status === 'APPROVED' },
      include: { user: { select: { name: true, email: true, id: true } } },
    });
    if (status === 'APPROVED') {
      await tx.user.update({ where: { id: updated.userId }, data: { role: 'VENDOR' } });
    }
    return updated;
  });

  sendSuccess(res, vendor, `Vendor ${status.toLowerCase()}`);
};

// ── Products ────────────────────────────────────────────────────────────────

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '20');
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const categoryId = req.query.categoryId as string;
  const vendorId = req.query.vendorId as string;
  const featured = req.query.featured as string;
  const available = req.query.available as string;
  const lowStock = req.query.lowStock as string;

  const where: Record<string, unknown> = {};
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { sku: { contains: search, mode: 'insensitive' } },
  ];
  if (categoryId) where.categoryId = categoryId;
  if (vendorId) where.vendorId = vendorId;
  if (featured === 'true') where.isFeatured = true;
  if (available === 'false') where.isAvailable = false;
  if (lowStock === 'true') where.stock = { lte: 5 };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        vendor: { select: { id: true, storeName: true } },
      },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);
  sendPaginated(res, products, total, page, limit);
};

const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  comparePrice: z.number().optional(),
  images: z.array(z.string()).default([]),
  categoryId: z.string(),
  vendorId: z.string(),
  sku: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  unit: z.string().default('piece'),
  weight: z.number().optional(),
  discount: z.number().min(0).max(100).default(0),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isTrending: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const body = productSchema.parse(req.body);
  const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
  const product = await prisma.product.create({ data: { ...body, slug } });
  sendSuccess(res, product, 'Product created', 201);
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const body = productSchema.partial().parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.id }, data: body });
  sendSuccess(res, product, 'Product updated');
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isAvailable: false } });
  sendSuccess(res, null, 'Product removed');
};

export const toggleProductFeatured = async (req: Request, res: Response): Promise<void> => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) { sendError(res, 'Not found', 404); return; }
  const updated = await prisma.product.update({ where: { id: req.params.id }, data: { isFeatured: !product.isFeatured } });
  sendSuccess(res, { isFeatured: updated.isFeatured });
};

// ── Categories ──────────────────────────────────────────────────────────────

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  const withCounts = req.query.counts !== 'false';
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: withCounts ? { select: { products: true } } : undefined,
      children: { select: { id: true, name: true, slug: true, isActive: true } },
    },
  });
  sendSuccess(res, categories);
};

const categorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const body = categorySchema.parse(req.body);
  const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const category = await prisma.category.create({ data: { ...body, slug } });
  sendSuccess(res, category, 'Category created', 201);
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const body = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({ where: { id: req.params.id }, data: body });
  sendSuccess(res, category, 'Category updated');
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const count = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (count > 0) { sendError(res, `Cannot delete: ${count} products assigned to this category`, 400); return; }
  await prisma.category.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Category deleted');
};

// ── Orders ──────────────────────────────────────────────────────────────────

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string;
  const search = req.query.search as string;
  const dateFrom = req.query.dateFrom as string;
  const dateTo = req.query.dateTo as string;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { orderNumber: { contains: search, mode: 'insensitive' } },
    { user: { name: { contains: search, mode: 'insensitive' } } },
  ];
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) (where.createdAt as Record<string, unknown>).gte = new Date(dateFrom);
    if (dateTo) (where.createdAt as Record<string, unknown>).lte = new Date(dateTo);
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true } },
        vendor: { select: { storeName: true } },
        address: { select: { line1: true, city: true, pincode: true } },
        items: { include: { product: { select: { name: true, images: true } } } },
        deliveryPartner: { select: { user: { select: { name: true, phone: true } } } },
      },
      skip, take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);
  sendPaginated(res, orders, total, page, limit);
};

export const getOrderDetail = async (req: Request, res: Response): Promise<void> => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { name: true, email: true, phone: true, avatar: true } },
      vendor: { select: { storeName: true, phone: true, email: true } },
      address: true,
      items: { include: { product: { select: { name: true, images: true, sku: true } } } },
      deliveryPartner: { select: { vehicleType: true, vehicleNo: true, user: { select: { name: true, phone: true } } } },
    },
  });
  if (!order) { sendError(res, 'Order not found', 404); return; }
  sendSuccess(res, order);
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { status, note } = z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
    note: z.string().optional(),
  }).parse(req.body);

  const updateData: Record<string, unknown> = {
    status,
    trackingHistory: {
      push: { status, timestamp: new Date().toISOString(), note: note || `Status updated to ${status} by admin` },
    },
  };
  if (status === 'DELIVERED') updateData.deliveredAt = new Date();

  const order = await prisma.order.update({ where: { id: req.params.id }, data: updateData });
  sendSuccess(res, order, `Order status updated to ${status}`);
};

// ── Banners ─────────────────────────────────────────────────────────────────

export const getBanners = async (_req: Request, res: Response): Promise<void> => {
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  sendSuccess(res, banners);
};

export const createBanner = async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    title: z.string().min(2),
    subtitle: z.string().optional(),
    image: z.string().url(),
    link: z.string().optional(),
    sortOrder: z.number().int().default(0),
    isActive: z.boolean().default(true),
  });
  const body = schema.parse(req.body);
  const banner = await prisma.banner.create({ data: body });
  sendSuccess(res, banner, 'Banner created', 201);
};

export const updateBanner = async (req: Request, res: Response): Promise<void> => {
  const schema = z.object({
    title: z.string().min(2).optional(),
    subtitle: z.string().optional(),
    image: z.string().url().optional(),
    link: z.string().optional(),
    sortOrder: z.number().int().optional(),
    isActive: z.boolean().optional(),
  });
  const body = schema.parse(req.body);
  const banner = await prisma.banner.update({ where: { id: req.params.id }, data: body });
  sendSuccess(res, banner, 'Banner updated');
};

export const deleteBanner = async (req: Request, res: Response): Promise<void> => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Banner deleted');
};

// ── Coupons ─────────────────────────────────────────────────────────────────

export const getCoupons = async (_req: Request, res: Response): Promise<void> => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  sendSuccess(res, coupons);
};

const couponSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'flat']).default('percentage'),
  discountValue: z.number().positive(),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().optional(),
  usageLimit: z.number().int().optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  const body = couponSchema.parse(req.body);
  const existing = await prisma.coupon.findUnique({ where: { code: body.code } });
  if (existing) { sendError(res, 'Coupon code already exists', 400); return; }
  const coupon = await prisma.coupon.create({ data: { ...body, expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined } });
  sendSuccess(res, coupon, 'Coupon created', 201);
};

export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  const body = couponSchema.partial().parse(req.body);
  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data: { ...body, expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined },
  });
  sendSuccess(res, coupon, 'Coupon updated');
};

export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Coupon deleted');
};

// ── Analytics ────────────────────────────────────────────────────────────────

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  const period = (req.query.period as string) || '7d';
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;

  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const [
    revenueByDay, ordersByStatus, topProducts, topVendors,
    newCustomers, repeatCustomers, avgOrderValue,
  ] = await Promise.all([
    // Revenue per day
    Promise.all(Array.from({ length: days }, (_, i) => {
      const d = new Date(from);
      d.setDate(d.getDate() + i);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      return Promise.all([
        prisma.order.aggregate({ where: { createdAt: { gte: d, lt: next } }, _sum: { total: true }, _count: true }),
        prisma.order.count({ where: { status: 'DELIVERED', deliveredAt: { gte: d, lt: next } } }),
      ]).then(([agg, delivered]) => ({
        date: d.toISOString().slice(0, 10),
        orders: agg._count,
        revenue: agg._sum.total || 0,
        delivered,
      }));
    })),
    // Orders by status
    prisma.order.groupBy({ by: ['status'], _count: { id: true }, where: { createdAt: { gte: from } } }),
    // Top products by revenue
    prisma.orderItem.groupBy({
      by: ['name'],
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
      where: { order: { createdAt: { gte: from } } },
    }),
    // Top vendors by revenue
    prisma.order.groupBy({
      by: ['vendorId'],
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
      where: { createdAt: { gte: from }, vendorId: { not: null } },
    }),
    // New customers
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: from } } }),
    // Repeat customers (ordered more than once)
    prisma.order.groupBy({
      by: ['userId'],
      having: { userId: { _count: { gt: 1 } } },
      _count: { id: true },
      where: { createdAt: { gte: from } },
    }).then(r => r.length),
    // Avg order value
    prisma.order.aggregate({ where: { createdAt: { gte: from } }, _avg: { total: true } }),
  ]);

  // Resolve vendor names
  const vendorIds = topVendors.map(v => v.vendorId).filter(Boolean) as string[];
  const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, storeName: true } });
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.storeName]));

  sendSuccess(res, {
    revenueByDay,
    ordersByStatus: Object.fromEntries(ordersByStatus.map(s => [s.status, s._count.id])),
    topProducts,
    topVendors: topVendors.filter(v => v.vendorId != null).map(v => ({ vendorId: v.vendorId, storeName: vendorMap[v.vendorId as string] || 'Unknown', revenue: v._sum.total || 0, orders: v._count.id })),
    summary: { newCustomers, repeatCustomers, avgOrderValue: avgOrderValue._avg.total || 0 },
  });
};

// ── Inventory ───────────────────────────────────────────────────────────────

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 30;
  const skip = (page - 1) * limit;
  const filter = req.query.filter as string;

  const where: Record<string, unknown> = {};
  if (filter === 'low') where.stock = { gt: 0, lte: 10 };
  else if (filter === 'out') where.stock = 0;
  else if (filter === 'healthy') where.stock = { gt: 10 };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, name: true, sku: true, stock: true, unit: true,
        images: true, isAvailable: true, price: true,
        category: { select: { name: true } },
        vendor: { select: { storeName: true } },
      },
      skip, take: limit,
      orderBy: { stock: 'asc' },
    }),
    prisma.product.count({ where }),
  ]);

  const [outOfStock, lowStock, healthy] = await Promise.all([
    prisma.product.count({ where: { stock: 0 } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
    prisma.product.count({ where: { stock: { gt: 10 } } }),
  ]);

  sendPaginated(res, products, total, page, limit, { outOfStock, lowStock, healthy });
};

export const updateStock = async (req: Request, res: Response): Promise<void> => {
  const { stock } = z.object({ stock: z.number().int().min(0) }).parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { stock, isAvailable: stock > 0 },
  });
  sendSuccess(res, { stock: product.stock, isAvailable: product.isAvailable }, 'Stock updated');
};

// ── Notifications ────────────────────────────────────────────────────────────

export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  const { title, message, type, userIds } = z.object({
    title: z.string().min(2),
    message: z.string().min(2),
    type: z.string().default('info'),
    userIds: z.array(z.string()).optional(),
  }).parse(req.body);

  let targets: string[];
  if (userIds && userIds.length > 0) {
    targets = userIds;
  } else {
    const users = await prisma.user.findMany({ where: { isActive: true }, select: { id: true } });
    targets = users.map(u => u.id);
  }

  await prisma.notification.createMany({
    data: targets.map(userId => ({ userId, title, message, type })),
  });

  sendSuccess(res, { sent: targets.length }, `Notification sent to ${targets.length} users`);
};
