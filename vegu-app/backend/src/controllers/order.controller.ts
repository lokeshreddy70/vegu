import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest } from '../types';

const orderSchema = z.object({
  addressId: z.string(),
  paymentMethod: z.enum(['COD', 'STRIPE', 'RAZORPAY', 'WALLET']).default('COD'),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

export const placeOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = orderSchema.parse(req.body);
  const userId = req.user!.userId;

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
  });

  if (cartItems.length === 0) {
    sendError(res, 'Cart is empty', 400);
    return;
  }

  for (const item of cartItems) {
    if (!item.product.isAvailable || item.product.stock < item.quantity) {
      sendError(res, `${item.product.name} is out of stock`, 400);
      return;
    }
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  let discount = 0;

  if (body.couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: body.couponCode,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });
    if (coupon && subtotal >= coupon.minOrderValue) {
      discount = coupon.discountType === 'percentage'
        ? Math.min(subtotal * (coupon.discountValue / 100), coupon.maxDiscount || Infinity)
        : coupon.discountValue;
      await prisma.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
    }
  }

  const total = subtotal + deliveryFee - discount;
  const vendorId = cartItems[0].product.vendorId;
  const orderNumber = `VGU-${Date.now().toString(36).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      orderNumber,
      userId,
      vendorId,
      addressId: body.addressId,
      paymentMethod: body.paymentMethod,
      paymentStatus: body.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
      subtotal,
      deliveryFee,
      discount,
      total,
      couponCode: body.couponCode,
      notes: body.notes,
      status: 'CONFIRMED',
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000),
      trackingHistory: [{ status: 'CONFIRMED', message: 'Order confirmed and looking for a rider', timestamp: new Date() }],
      items: {
        create: cartItems.map(i => ({
          productId: i.productId,
          name: i.product.name,
          image: i.product.images[0] || null,
          price: i.product.price,
          quantity: i.quantity,
          total: i.product.price * i.quantity,
        })),
      },
    },
    include: { items: true, address: true },
  });

  // Decrement stock
  await Promise.all(
    cartItems.map(i =>
      prisma.product.update({ where: { id: i.productId }, data: { stock: { decrement: i.quantity } } })
    )
  );

  // Clear cart
  await prisma.cartItem.deleteMany({ where: { userId } });

  sendSuccess(res, order, 'Order placed successfully', 201);
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string || '1');
  const limit = 10;
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId: req.user!.userId },
      include: { items: true, vendor: { select: { storeName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.order.count({ where: { userId: req.user!.userId } }),
  ]);

  sendPaginated(res, orders, total, page, limit);
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
    include: {
      items: { include: { product: { select: { slug: true, images: true } } } },
      address: true,
      vendor: { select: { storeName: true, storeSlug: true } },
      deliveryPartner: { include: { user: { select: { name: true, phone: true, avatar: true } } } },
    },
  });
  if (!order) {
    sendError(res, 'Order not found', 404);
    return;
  }
  sendSuccess(res, order);
};

export const cancelOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const order = await prisma.order.findFirst({
    where: { id: req.params.id, userId: req.user!.userId },
  });
  if (!order) {
    sendError(res, 'Order not found', 404);
    return;
  }
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    sendError(res, 'Order cannot be cancelled at this stage', 400);
    return;
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      trackingHistory: {
        push: { status: 'CANCELLED', message: 'Order cancelled by customer', timestamp: new Date() },
      },
    },
  });

  sendSuccess(res, updated, 'Order cancelled');
};
