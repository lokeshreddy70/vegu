import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { sendSuccess } from '../../utils/response';

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  const period = String(req.query.period || '7d');
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;

  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const [
    revenueByDay, ordersByStatus, topProducts, topVendors,
    newCustomers, repeatCustomers, avgOrderValue,
  ] = await Promise.all([
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
    prisma.order.groupBy({ by: ['status'], _count: { id: true }, where: { createdAt: { gte: from } } }),
    prisma.orderItem.groupBy({
      by: ['name'],
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 10,
      where: { order: { createdAt: { gte: from } } },
    }),
    prisma.order.groupBy({
      by: ['vendorId'],
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 5,
      where: { createdAt: { gte: from }, vendorId: { not: null } },
    }),
    prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: from } } }),
    prisma.order.groupBy({
      by: ['userId'],
      having: { userId: { _count: { gt: 1 } } },
      _count: { id: true },
      where: { createdAt: { gte: from } },
    }).then(r => r.length),
    prisma.order.aggregate({ where: { createdAt: { gte: from } }, _avg: { total: true } }),
  ]);

  const vendorIds = topVendors.map(v => v.vendorId).filter(Boolean) as string[];
  const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds } }, select: { id: true, storeName: true } });
  const vendorMap = Object.fromEntries(vendors.map(v => [v.id, v.storeName]));

  sendSuccess(res, {
    revenueByDay,
    ordersByStatus: Object.fromEntries(ordersByStatus.map(s => [s.status, s._count.id])),
    topProducts,
    topVendors: topVendors.filter(v => v.vendorId != null).map(v => ({
      vendorId: v.vendorId,
      storeName: vendorMap[v.vendorId as string] || 'Unknown',
      revenue: v._sum.total || 0,
      orders: v._count.id,
    })),
    summary: { newCustomers, repeatCustomers, avgOrderValue: avgOrderValue._avg.total || 0 },
  });
};
