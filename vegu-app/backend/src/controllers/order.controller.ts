import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { AuthRequest } from '../types';
import { randomBytes } from 'crypto';

const orderSchema = z.object({
  addressId: z.string().min(1),
  paymentMethod: z.enum(['COD', 'STRIPE', 'RAZORPAY', 'WALLET']).default('COD'),
  couponCode: z.string().max(30).optional(),
  notes: z.string().max(500).optional(),
});

/** Generate a cryptographically random, collision-resistant order number */
function generateOrderNumber(): string {
  return `VGU-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export const placeOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = orderSchema.parse(req.body);
  const userId = req.user!.userId;

  // Read cart outside transaction (read-only, no lock needed)
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { select: { id: true, name: true, price: true, stock: true, isAvailable: true, vendorId: true, images: true } } },
  });

  if (cartItems.length === 0) {
    sendError(res, 'Cart is empty', 400);
    return;
  }

  // Pre-validate all items before entering transaction
  for (const item of cartItems) {
    if (!item.product.isAvailable) {
      sendError(res, `${item.product.name} is no longer available`, 400);
      return;
    }
    if (item.product.stock < item.quantity) {
      sendError(res, `${item.product.name} only has ${item.product.stock} units in stock`, 400);
      return;
    }
  }

  // Validate address belongs to this user
  const address = await prisma.address.findFirst({
    where: { id: body.addressId, userId },
  });
  if (!address) {
    sendError(res, 'Address not found', 404);
    return;
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const deliveryFee = subtotal >= 500 ? 0 : 40;
  let discount = 0;
  let appliedCouponId: string | null = null;

  // Validate coupon BEFORE transaction (read-only check)
  if (body.couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: {
        code: body.couponCode.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!coupon) {
      sendError(res, 'Invalid or expired coupon code', 400);
      return;
    }

    if (subtotal < coupon.minOrderValue) {
      sendError(res, `Minimum order of ₹${coupon.minOrderValue} required for this coupon`, 400);
      return;
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      sendError(res, 'This coupon has reached its usage limit', 400);
      return;
    }

    discount = coupon.discountType === 'percentage'
      ? Math.min(subtotal * (coupon.discountValue / 100), coupon.maxDiscount ?? Infinity)
      : coupon.discountValue;

    discount = Math.min(discount, subtotal); // discount can't exceed subtotal
    appliedCouponId = coupon.id;
  }

  const total = Math.max(0, subtotal + deliveryFee - discount);
  const vendorId = cartItems[0].product.vendorId;
  const orderNumber = generateOrderNumber();

  // ATOMIC TRANSACTION: stock decrement + order create + coupon increment + cart clear
  const order = await prisma.$transaction(async (tx) => {
    // Atomically decrement stock with a check — prevents overselling under concurrent load
    for (const item of cartItems) {
      const updated = await tx.product.updateMany({
        where: {
          id: item.productId,
          stock: { gte: item.quantity },
          isAvailable: true,
        },
        data: { stock: { decrement: item.quantity } },
      });

      if (updated.count === 0) {
        // Stock was concurrently modified — another order beat us to it
        throw new Error(`${item.product.name} is no longer available in the requested quantity`);
      }
    }

    // Create order
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        userId,
        vendorId,
        addressId: body.addressId,
        paymentMethod: body.paymentMethod,
        paymentStatus: 'PENDING',
        subtotal,
        deliveryFee,
        discount,
        total,
        couponCode: body.couponCode?.toUpperCase(),
        notes: body.notes,
        status: 'CONFIRMED',
        estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000),
        trackingHistory: [{
          status: 'CONFIRMED',
          note: 'Order confirmed',
          timestamp: new Date().toISOString(),
        }],
        items: {
          create: cartItems.map(i => ({
            productId: i.productId,
            name: i.product.name,
            image: i.product.images[0] ?? null,
            price: i.product.price,
            quantity: i.quantity,
            total: i.product.price * i.quantity,
          })),
        },
      },
      include: { items: true, address: true },
    });

    // Increment coupon usage inside transaction
    if (appliedCouponId) {
      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // Clear cart
    await tx.cartItem.deleteMany({ where: { userId } });

    return newOrder;
  });

  sendSuccess(res, order, 'Order placed successfully', 201);
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string || '1'));
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
    include: { items: true },
  });

  if (!order) {
    sendError(res, 'Order not found', 404);
    return;
  }
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    sendError(res, 'Order cannot be cancelled at this stage', 400);
    return;
  }

  // Restore stock + cancel order atomically
  await prisma.$transaction(async (tx) => {
    // Restore stock for each item
    await Promise.all(
      order.items.map(item =>
        tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      )
    );

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        trackingHistory: {
          push: {
            status: 'CANCELLED',
            note: 'Order cancelled by customer',
            timestamp: new Date().toISOString(),
          },
        },
      },
    });
  });

  sendSuccess(res, null, 'Order cancelled');
};
