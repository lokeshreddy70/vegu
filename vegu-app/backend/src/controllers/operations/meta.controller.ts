import { Response } from 'express';
import { prisma } from '../../prisma/client';
import { sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../types';
import { resolveStaffScope } from './helpers';

export const getOperationsStores = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);

  const stores = await prisma.store.findMany({
    where: scope.storeId ? { id: scope.storeId } : {},
    orderBy: { createdAt: 'asc' },
    include: {
      manager: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { orders: true, products: true, staff: true } },
    },
  });

  sendSuccess(res, stores);
};

export const getOperationsRiders = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);

  const riders = await prisma.deliveryPartner.findMany({
    where: {
      ...(scope.storeId ? { deliveries: { some: { storeId: scope.storeId } } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      _count: { select: { deliveries: true } },
    },
    orderBy: [{ status: 'asc' }, { totalDeliveries: 'desc' }],
    take: 100,
  });

  sendSuccess(res, riders);
};

export const getOperationsVendors = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);

  const vendors = await prisma.vendor.findMany({
    where: scope.storeId ? { storeId: scope.storeId } : {},
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { products: true, orders: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  sendSuccess(res, vendors);
};

export const getOperationsSupportTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);
  const tickets = await prisma.supportTicket.findMany({
    where: {
      ...(scope.storeId ? { order: { storeId: scope.storeId } } : {}),
    },
    include: {
      user: { select: { id: true, name: true, phone: true } },
      order: { select: { id: true, orderNumber: true, status: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 100,
  });

  sendSuccess(res, tickets);
};
