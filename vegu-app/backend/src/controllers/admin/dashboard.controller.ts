import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendError, sendSuccess } from '../../utils/response';

export const getDashboard = async (_req: Request, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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

export const getUsersSummary = async (_req: Request, res: Response): Promise<void> => {
  const byRole = await prisma.user.groupBy({ by: ['role'], _count: { id: true } });
  const summary = Object.fromEntries(byRole.map(r => [r.role, r._count.id]));
  sendSuccess(res, summary);
};

export const broadcastNotification = async (req: Request, res: Response): Promise<void> => {
  const { title, message, type, userIds, audience } = z.object({
    title: z.string().min(2).max(200),
    message: z.string().min(2).max(1000).optional(),
    body: z.string().min(2).max(1000).optional(),
    type: z.string().default('info'),
    audience: z.enum(['ALL', 'CUSTOMERS', 'VENDORS', 'RIDERS']).default('ALL'),
    userIds: z.array(z.string()).optional(),
  }).transform((data) => ({
    ...data,
    message: data.message ?? data.body ?? '',
  })).parse(req.body);

  if (!message) {
    sendError(res, 'Message is required', 400);
    return;
  }

  let targets: string[];
  if (userIds && userIds.length > 0) {
    targets = userIds;
  } else {
    const roleByAudience: Record<string, 'CUSTOMER' | 'VENDOR' | 'DELIVERY' | null> = {
      ALL: null,
      CUSTOMERS: 'CUSTOMER',
      VENDORS: 'VENDOR',
      RIDERS: 'DELIVERY',
    };
    const role = roleByAudience[audience] ?? null;
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(role ? { role } : {}),
      },
      select: { id: true },
    });
    targets = users.map(u => u.id);
  }

  if (targets.length === 0) {
    sendSuccess(res, { sent: 0 }, 'No active users found for selected audience');
    return;
  }

  await prisma.notification.createMany({
    data: targets.map(userId => ({ userId, title, message, type })),
  });

  sendSuccess(res, { sent: targets.length }, `Notification sent to ${targets.length} users`);
};
