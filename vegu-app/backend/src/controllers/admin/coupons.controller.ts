import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const couponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  description: z.string().max(500).optional(),
  discountType: z.enum(['percentage', 'flat']).default('percentage'),
  discountValue: z.number().positive(),
  minOrderValue: z.number().min(0).default(0),
  maxDiscount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

export const getCoupons = async (_req: Request, res: Response): Promise<void> => {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  sendSuccess(res, coupons);
};

export const createCoupon = async (req: Request, res: Response): Promise<void> => {
  const body = couponSchema.parse(req.body);
  const existing = await prisma.coupon.findUnique({ where: { code: body.code } });
  if (existing) { sendError(res, 'Coupon code already exists', 400); return; }
  const coupon = await prisma.coupon.create({
    data: { ...body, expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined },
  });
  sendSuccess(res, coupon, 'Coupon created', 201);
};

export const updateCoupon = async (req: Request, res: Response): Promise<void> => {
  const body = couponSchema.partial().parse(req.body);
  const coupon = await prisma.coupon.update({
    where: { id: req.params.id },
    data: { ...body, expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined },
  });
  sendSuccess(res, coupon, 'Coupon updated');
};

export const deleteCoupon = async (req: Request, res: Response): Promise<void> => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Coupon deleted');
};
