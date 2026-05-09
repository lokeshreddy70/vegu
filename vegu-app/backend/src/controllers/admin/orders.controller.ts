import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

export const getOrders = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
  const limit = 20;
  const status = req.query.status as string | undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : undefined;
  const dateFrom = req.query.dateFrom as string | undefined;
  const dateTo = req.query.dateTo as string | undefined;

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
      skip: (page - 1) * limit,
      take: limit,
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
    note: z.string().max(500).optional(),
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
