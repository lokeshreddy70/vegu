import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Validate a coupon code (used by checkout)
router.post('/validate', authenticate, async (req: Request, res: Response) => {
  const parsed = z.object({
    code: z.string(),
    orderTotal: z.number().positive(),
  }).safeParse(req.body);

  if (!parsed.success) {
    sendError(res, 'Invalid input', 400);
    return;
  }

  const { code, orderTotal } = parsed.data;
  const coupon = await prisma.coupon.findFirst({
    where: {
      code: code.toUpperCase().trim(),
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!coupon) {
    sendError(res, 'Invalid or expired coupon code', 404);
    return;
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    sendError(res, 'Coupon usage limit reached', 400);
    return;
  }

  if (orderTotal < coupon.minOrderValue) {
    sendError(res, `Minimum order ₹${coupon.minOrderValue} required for this coupon`, 400);
    return;
  }

  const discount =
    coupon.discountType === 'percentage'
      ? Math.min(orderTotal * (coupon.discountValue / 100), coupon.maxDiscount ?? Infinity)
      : Math.min(coupon.discountValue, orderTotal);

  sendSuccess(res, {
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    discount: Math.round(discount * 100) / 100,
  }, 'Coupon applied');
});

// List all active coupons (public — let customers see what's available)
router.get('/', async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: {
      code: true,
      description: true,
      discountType: true,
      discountValue: true,
      minOrderValue: true,
      maxDiscount: true,
    },
  });
  sendSuccess(res, coupons);
});

export default router;
