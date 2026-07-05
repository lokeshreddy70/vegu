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
  useWallet: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

const orderChatSchema = z.object({
  message: z.string().min(1).max(1000),
});

/** Generate a cryptographically random, collision-resistant order number */
function generateOrderNumber(): string {
  return `VGU-${randomBytes(4).toString('hex').toUpperCase()}`;
}

export const placeOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = orderSchema.parse(req.body);
  const userId = req.user!.userId;

  const settings = await prisma.setting.findMany({
    where: { key: { in: ['maintenanceMode', 'servicePauseUntil', 'servicePauseReason'] } },
  });
  const map = new Map(settings.map((s) => [s.key, s.value]));
  const maintenanceMode = map.get('maintenanceMode') === 'true';
  const pauseUntil = map.get('servicePauseUntil');
  const pauseReason = map.get('servicePauseReason');
  const isPausedByWindow = !!pauseUntil && !Number.isNaN(new Date(pauseUntil).getTime()) && new Date(pauseUntil) > new Date();
  if (maintenanceMode || isPausedByWindow) {
    sendError(
      res,
      `Service is temporarily paused${pauseUntil ? ` until ${new Date(pauseUntil).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}. ${pauseReason || 'Please try again shortly.'}`,
      503,
    );
    return;
  }

  // Read cart outside transaction (read-only, no lock needed)
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: { select: { id: true, name: true, price: true, stock: true, isAvailable: true, vendorId: true, storeId: true, images: true } } },
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
  let walletApplied = 0;

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
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { referredBy: true } });
  const wallet = await prisma.wallet.findUnique({ where: { userId }, select: { id: true, balance: true } });

  if (body.useWallet && wallet) {
    const settings = await prisma.setting.findMany({ where: { key: { in: ['walletMaxUsagePercent'] } } });
    const map = new Map(settings.map((s) => [s.key, s.value]));
    const maxPercent = Math.min(100, Math.max(0, parseFloat(map.get('walletMaxUsagePercent') || '30')));
    const maxWalletAllowed = total * (maxPercent / 100);
    walletApplied = Math.min(wallet.balance, maxWalletAllowed);
  }

  const netTotal = Math.max(0, total - walletApplied);
  const vendorId = cartItems[0].product.vendorId;
  const storeId = cartItems[0].product.storeId;
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
        storeId,
        addressId: body.addressId,
        paymentMethod: body.paymentMethod,
        paymentStatus: 'PENDING',
        subtotal,
        deliveryFee,
        discount: discount + walletApplied,
        total: netTotal,
        couponCode: body.couponCode?.toUpperCase(),
        notes: body.notes,
        status: 'CONFIRMED',
        opsStage: 'CUSTOMER_ORDERED',
        estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000),
        trackingHistory: [{
          status: 'CONFIRMED',
          stage: 'CUSTOMER_ORDERED',
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

    // Re-validate and increment coupon usage atomically inside transaction
    if (appliedCouponId) {
      const freshCoupon = await tx.coupon.findUnique({ where: { id: appliedCouponId } });
      if (!freshCoupon || (freshCoupon.usageLimit !== null && freshCoupon.usedCount >= freshCoupon.usageLimit)) {
        throw new Error('Coupon is no longer available');
      }
      await tx.coupon.update({
        where: { id: appliedCouponId },
        data: { usedCount: { increment: 1 } },
      });
    }

    if (walletApplied > 0 && wallet) {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: walletApplied } },
      });
      await tx.transaction.create({
        data: {
          walletId: wallet.id,
          type: 'DEBIT',
          amount: walletApplied,
          description: `Wallet used for order ${orderNumber}`,
          reference: orderNumber,
        },
      });
    }

    const successfulOrders = await tx.order.count({
      where: { userId, status: { in: ['CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'] } },
    });
    if (successfulOrders <= 1 && user?.referredBy) {
      const settings = await tx.setting.findMany({ where: { key: { in: ['referralEnabled', 'referralRewardAmount', 'referralMinOrderValue'] } } });
      const sMap = new Map(settings.map((s) => [s.key, s.value]));
      const referralEnabled = (sMap.get('referralEnabled') ?? 'true') === 'true';
      const referralRewardAmount = parseFloat(sMap.get('referralRewardAmount') || '50');
      const referralMinOrderValue = parseFloat(sMap.get('referralMinOrderValue') || '199');
      if (referralEnabled && netTotal >= referralMinOrderValue && referralRewardAmount > 0) {
        const refWallet = await tx.wallet.upsert({
          where: { userId: user.referredBy },
          update: { balance: { increment: referralRewardAmount } },
          create: { userId: user.referredBy, balance: referralRewardAmount },
        });
        await tx.transaction.create({
          data: {
            walletId: refWallet.id,
            type: 'CREDIT',
            amount: referralRewardAmount,
            description: `Referral reward for ${orderNumber}`,
            reference: orderNumber,
          },
        });
      }
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
      include: {
        items: true,
        vendor: { select: { storeName: true } },
        deliveryPartner: {
          select: {
            id: true,
            currentLat: true,
            currentLng: true,
            vehicleType: true,
            vehicleNo: true,
            status: true,
            user: { select: { name: true, phone: true, avatar: true } },
          },
        },
      },
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
      deliveryPartner: { select: {
        id: true,
        currentLat: true,
        currentLng: true,
        vehicleType: true,
        vehicleNo: true,
        status: true,
        user: { select: { name: true, phone: true, avatar: true } },
      } },
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

const resolveChatSenderRole = (role: string): 'CUSTOMER' | 'RIDER' | 'ADMIN' => {
  if (role === 'DELIVERY') return 'RIDER';
  if (role === 'ADMIN' || role === 'OWNER') return 'ADMIN';
  return 'CUSTOMER';
};

export const getOrderChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;

  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { userId },
        { deliveryPartner: { userId } },
        ...(role === 'ADMIN' || role === 'OWNER' ? [{}] : []),
      ],
    },
    select: { id: true },
  });

  if (!order) {
    sendError(res, 'Order not found', 404);
    return;
  }

  const messages = await prisma.orderChatMessage.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
    take: 300,
  });

  sendSuccess(res, messages);
};

export const postOrderChat = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  const role = req.user!.role;
  const body = orderChatSchema.parse(req.body);

  const order = await prisma.order.findFirst({
    where: {
      id: req.params.id,
      OR: [
        { userId },
        { deliveryPartner: { userId } },
        ...(role === 'ADMIN' || role === 'OWNER' ? [{}] : []),
      ],
    },
    include: {
      user: { select: { id: true } },
      deliveryPartner: { select: { id: true, userId: true } },
    },
  });

  if (!order) {
    sendError(res, 'Order not found', 404);
    return;
  }

  const msg = await prisma.orderChatMessage.create({
    data: {
      orderId: order.id,
      senderId: userId,
      senderRole: resolveChatSenderRole(role),
      message: body.message.trim(),
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
  });

  sendSuccess(res, msg, 'Message sent', 201);
};
