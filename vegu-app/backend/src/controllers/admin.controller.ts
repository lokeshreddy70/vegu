import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';

export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  const [totalUsers, totalVendors, totalOrders, totalRevenue, pendingVendors, recentOrders] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.vendor.count(),
    prisma.order.count(),
    prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }),
    prisma.vendor.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } }, vendor: { select: { storeName: true } } },
    }),
  ]);

  sendSuccess(res, {
    stats: {
      totalUsers,
      totalVendors,
      totalOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      pendingVendors,
    },
    recentOrders,
  });
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;

  const where = search
    ? { OR: [{ name: { contains: search, mode: 'insensitive' as const } }, { email: { contains: search, mode: 'insensitive' as const } }] }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true } }),
    prisma.user.count({ where }),
  ]);
  sendPaginated(res, users, total, page, limit);
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
  sendSuccess(res, { isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
};

export const getVendors = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string;

  const where = status ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' } : {};

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: { user: { select: { name: true, email: true } }, _count: { select: { products: true, orders: true } } },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vendor.count({ where }),
  ]);
  sendPaginated(res, vendors, total, page, limit);
};

export const updateVendorStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']) }).parse(req.body);
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: { status, isActive: status === 'APPROVED' },
  });
  sendSuccess(res, vendor, `Vendor ${status.toLowerCase()}`);
};

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 20;
  const skip = (page - 1) * limit;
  const status = req.query.status as string;

  const where = status ? { status: status as 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { name: true, email: true } },
        vendor: { select: { storeName: true } },
        items: { take: 1 },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);
  sendPaginated(res, orders, total, page, limit);
};

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
  });
  const body = schema.parse(req.body);
  const banner = await prisma.banner.create({ data: body });
  sendSuccess(res, banner, 'Banner created', 201);
};

export const deleteBanner = async (req: Request, res: Response): Promise<void> => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Banner deleted');
};
