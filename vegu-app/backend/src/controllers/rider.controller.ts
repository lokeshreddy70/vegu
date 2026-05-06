import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

const getPartner = async (userId: string) => {
  const partner = await prisma.deliveryPartner.findUnique({ where: { userId } });
  if (!partner) throw new Error('NOT_FOUND');
  return partner;
};

// ── Dashboard stats ─────────────────────────────────────────────────────────

export const getRiderDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partner = await getPartner(req.user!.userId);

    const [activeOrder, todayDeliveries, pendingOrders] = await Promise.all([
      prisma.order.findFirst({
        where: {
          deliveryPartnerId: partner.id,
          status: { in: ['CONFIRMED', 'OUT_FOR_DELIVERY'] },
        },
        include: {
          user: { select: { name: true, phone: true } },
          address: true,
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { updatedAt: 'desc' },
      }),

      prisma.order.count({
        where: {
          deliveryPartnerId: partner.id,
          status: 'DELIVERED',
          deliveredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),

      prisma.order.findMany({
        where: { status: 'CONFIRMED', deliveryPartnerId: null },
        take: 10,
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { name: true } },
          address: { select: { label: true, city: true, line1: true } },
          items: { select: { quantity: true } },
        },
      }),
    ]);

    sendSuccess(res, {
      partner,
      activeOrder,
      todayDeliveries,
      pendingOrders,
    });
  } catch (err) {
    if ((err as Error).message === 'NOT_FOUND') {
      sendError(res, 'Rider profile not found', 404);
    } else {
      sendError(res, 'Failed to load dashboard', 500);
    }
  }
};

// ── My assigned orders ──────────────────────────────────────────────────────

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partner = await getPartner(req.user!.userId);

    const orders = await prisma.order.findMany({
      where: { deliveryPartnerId: partner.id },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      include: {
        user: { select: { name: true, phone: true } },
        address: true,
        items: {
          include: { product: { select: { name: true, images: true } } },
        },
      },
    });

    sendSuccess(res, orders);
  } catch {
    sendError(res, 'Failed to fetch orders', 500);
  }
};

// ── Available orders to pick up ─────────────────────────────────────────────

export const getAvailableOrders = async (_req: AuthRequest, res: Response): Promise<void> => {
  const orders = await prisma.order.findMany({
    where: { status: 'CONFIRMED', deliveryPartnerId: null },
    orderBy: { createdAt: 'asc' },
    take: 20,
    include: {
      user: { select: { name: true } },
      address: { select: { label: true, line1: true, city: true } },
      items: { select: { quantity: true } },
    },
  });

  sendSuccess(res, orders);
};

// ── Accept an order ─────────────────────────────────────────────────────────

export const acceptOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partner = await getPartner(req.user!.userId);

    // Check no active order already
    const active = await prisma.order.findFirst({
      where: {
        deliveryPartnerId: partner.id,
        status: { in: ['CONFIRMED', 'OUT_FOR_DELIVERY'] },
      },
    });
    if (active) {
      sendError(res, 'Complete your current delivery first', 400);
      return;
    }

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, status: 'CONFIRMED', deliveryPartnerId: null },
    });
    if (!order) {
      sendError(res, 'Order not available', 404);
      return;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        deliveryPartnerId: partner.id,
        trackingHistory: {
          push: { status: 'ASSIGNED', timestamp: new Date().toISOString(), note: 'Rider assigned' },
        },
      },
    });

    sendSuccess(res, updated, 'Order accepted');
  } catch (err) {
    if ((err as Error).message === 'NOT_FOUND') sendError(res, 'Rider profile not found', 404);
    else sendError(res, 'Failed to accept order', 500);
  }
};

// ── Update order status ─────────────────────────────────────────────────────

const statusSchema = z.object({
  status: z.enum(['OUT_FOR_DELIVERY', 'DELIVERED']),
  note: z.string().optional(),
});

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid status', 400, parsed.error.flatten());
    return;
  }

  try {
    const partner = await getPartner(req.user!.userId);
    const { status, note } = parsed.data;

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, deliveryPartnerId: partner.id },
    });
    if (!order) {
      sendError(res, 'Order not found or not assigned to you', 404);
      return;
    }

    const updateData: Record<string, unknown> = {
      status,
      trackingHistory: {
        push: {
          status,
          timestamp: new Date().toISOString(),
          note: note || (status === 'DELIVERED' ? 'Order delivered' : 'Out for delivery'),
        },
      },
    };

    if (status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
      // Update partner stats
      await prisma.deliveryPartner.update({
        where: { id: partner.id },
        data: {
          totalDeliveries: { increment: 1 },
          totalEarnings: { increment: order.deliveryFee },
          status: 'AVAILABLE',
        },
      });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
      include: {
        user: { select: { name: true, phone: true } },
        address: true,
      },
    });

    sendSuccess(res, updated, `Status updated to ${status}`);
  } catch (err) {
    if ((err as Error).message === 'NOT_FOUND') sendError(res, 'Rider profile not found', 404);
    else sendError(res, 'Failed to update status', 500);
  }
};

// ── Update rider location ───────────────────────────────────────────────────

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const updateLocation = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = locationSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid location', 400);
    return;
  }
  try {
    const partner = await getPartner(req.user!.userId);
    await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { currentLat: parsed.data.lat, currentLng: parsed.data.lng },
    });
    sendSuccess(res, null, 'Location updated');
  } catch {
    sendError(res, 'Failed to update location', 500);
  }
};

// ── Toggle online/offline ───────────────────────────────────────────────────

export const toggleStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const partner = await getPartner(req.user!.userId);
    const newStatus = partner.status === 'OFFLINE' ? 'AVAILABLE' : 'OFFLINE';
    const updated = await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { status: newStatus },
    });
    sendSuccess(res, { status: updated.status }, `You are now ${newStatus.toLowerCase()}`);
  } catch {
    sendError(res, 'Failed to update status', 500);
  }
};

// ── Register as rider ───────────────────────────────────────────────────────

const registerSchema = z.object({
  vehicleType: z.enum(['bike', 'cycle', 'scooter', 'car']).default('bike'),
  vehicleNo: z.string().optional(),
});

export const registerAsRider = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid data', 400, parsed.error.flatten());
    return;
  }

  const existing = await prisma.deliveryPartner.findUnique({
    where: { userId: req.user!.userId },
  });
  if (existing) {
    sendError(res, 'Already registered as a rider', 400);
    return;
  }

  const [partner] = await prisma.$transaction([
    prisma.deliveryPartner.create({
      data: {
        userId: req.user!.userId,
        vehicleType: parsed.data.vehicleType,
        vehicleNo: parsed.data.vehicleNo,
      },
    }),
    prisma.user.update({
      where: { id: req.user!.userId },
      data: { role: 'DELIVERY' },
    }),
  ]);

  sendSuccess(res, partner, 'Registered as rider', 201);
};
