import { Response } from 'express';
import { z } from 'zod';
import { OpsOrderStage, OrderStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { sendError, sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../types';
import { resolveStaffScope } from './helpers';

const listSchema = z.object({
  status: z.string().optional(),
  stage: z.nativeEnum(OpsOrderStage).optional(),
  limit: z.coerce.number().min(1).max(100).default(25),
});

const updateSchema = z.object({
  stage: z.nativeEnum(OpsOrderStage),
  reason: z.string().max(300).optional(),
  riderId: z.string().optional(),
  barcode: z.string().max(100).optional(),
});

const stageToStatus: Partial<Record<OpsOrderStage, OrderStatus>> = {
  STORE_ACCEPTED: 'CONFIRMED',
  PACKING_STARTED: 'PREPARING',
  PACKED: 'READY_FOR_PICKUP',
  BARCODE_GENERATED: 'READY_FOR_PICKUP',
  RIDER_ASSIGNED: 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const getOperationsOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const query = listSchema.parse(req.query);
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);

  const where: Record<string, unknown> = {};
  if (scope.storeId) where.storeId = scope.storeId;
  if (query.status) where.status = query.status;
  if (query.stage) where.opsStage = query.stage;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: query.limit,
    include: {
      user: { select: { id: true, name: true, phone: true } },
      items: true,
      address: true,
      deliveryPartner: { select: { id: true, user: { select: { name: true, phone: true } }, status: true } },
      packedByStaff: { select: { id: true, name: true } },
    },
  });

  sendSuccess(res, orders);
};

export const updateOperationsOrderStage = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = updateSchema.parse(req.body);
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);

  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      ...(scope.storeId ? { storeId: scope.storeId } : {}),
    },
  });

  if (!order) {
    sendError(res, 'Order not found', 404);
    return;
  }

  const trackingHistory = Array.isArray(order.trackingHistory) ? [...order.trackingHistory] : [];
  trackingHistory.push({
    stage: body.stage,
    note: body.reason || 'Updated by operations',
    by: req.user!.userId,
    timestamp: new Date().toISOString(),
  });

  const data: Record<string, unknown> = {
    opsStage: body.stage,
    trackingHistory,
  };

  const mappedStatus = stageToStatus[body.stage];
  if (mappedStatus) data.status = mappedStatus;

  if (body.stage === 'PACKING_STARTED') {
    data.packingStartedAt = new Date();
  }
  if (body.stage === 'PACKED') {
    data.packedAt = new Date();
    data.packedByStaffId = req.user!.userId;
  }
  if (body.stage === 'BARCODE_GENERATED') {
    data.packingBarcode = body.barcode || `PKG-${order.orderNumber}`;
  }
  if (body.stage === 'RIDER_ASSIGNED' && body.riderId) {
    data.deliveryPartnerId = body.riderId;
  }
  if (body.stage === 'DELIVERED') {
    data.deliveredAt = new Date();
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data,
    include: {
      user: { select: { name: true, phone: true } },
      items: true,
      deliveryPartner: { select: { id: true, user: { select: { name: true, phone: true } } } },
    },
  });

  await prisma.activityLog.create({
    data: {
      actorUserId: req.user!.userId,
      module: 'OPERATIONS_ORDER',
      action: `STAGE_${body.stage}`,
      targetId: order.id,
      metadata: {
        reason: body.reason || null,
        riderId: body.riderId || null,
      },
    },
  });

  sendSuccess(res, updated, 'Order workflow updated');
};
