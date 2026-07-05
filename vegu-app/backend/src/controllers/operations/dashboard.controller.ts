import { Response } from 'express';
import { prisma } from '../../prisma/client';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../types';
import { resolveStaffScope } from './helpers';

const startOfDay = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getOperationsDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);
  const where = scope.storeId ? { storeId: scope.storeId } : {};

  const [todayOrders, pendingOrders, packedOrders, deliveredOrders, cancelledOrders, sales, lowStockProducts] = await Promise.all([
    prisma.order.count({ where: { ...where, createdAt: { gte: startOfDay() } } }),
    prisma.order.count({ where: { ...where, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING'] } } }),
    prisma.order.count({ where: { ...where, opsStage: { in: ['PACKED', 'BARCODE_GENERATED', 'RIDER_ASSIGNED'] } } }),
    prisma.order.count({ where: { ...where, status: 'DELIVERED', createdAt: { gte: startOfDay() } } }),
    prisma.order.count({ where: { ...where, status: 'CANCELLED', createdAt: { gte: startOfDay() } } }),
    prisma.order.aggregate({ where: { ...where, status: 'DELIVERED', createdAt: { gte: startOfDay() } }, _sum: { total: true } }),
    prisma.product.count({ where: { ...(scope.storeId ? { storeId: scope.storeId } : {}), isAvailable: true, stock: { lte: 10 } } }),
  ]);

  sendSuccess(res, {
    todayOrders,
    pendingOrders,
    packedOrders,
    deliveredOrders,
    cancelledOrders,
    todaySales: sales._sum.total || 0,
    inventoryAlerts: lowStockProducts,
    scope,
  });
};
