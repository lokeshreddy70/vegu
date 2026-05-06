import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export const getCart = async (req: AuthRequest, res: Response): Promise<void> => {
  const items = await prisma.cartItem.findMany({
    where: { userId: req.user!.userId },
    include: { product: { select: { id: true, name: true, slug: true, price: true, images: true, stock: true, unit: true, isAvailable: true } } },
    orderBy: { createdAt: 'desc' },
  });
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  sendSuccess(res, { items, subtotal, itemCount: items.length });
};

export const addToCart = async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId, quantity = 1 } = z.object({ productId: z.string(), quantity: z.number().int().positive().default(1) }).parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isAvailable) {
    sendError(res, 'Product not available', 400);
    return;
  }
  if (product.stock < quantity) {
    sendError(res, 'Insufficient stock', 400);
    return;
  }

  const item = await prisma.cartItem.upsert({
    where: { userId_productId: { userId: req.user!.userId, productId } },
    update: { quantity: { increment: quantity } },
    create: { userId: req.user!.userId, productId, quantity },
    include: { product: true },
  });

  sendSuccess(res, item, 'Added to cart', 201);
};

export const updateCartItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const { quantity } = z.object({ quantity: z.number().int().positive() }).parse(req.body);
  const { productId } = req.params;

  const item = await prisma.cartItem.update({
    where: { userId_productId: { userId: req.user!.userId, productId } },
    data: { quantity },
    include: { product: { select: { name: true, price: true } } },
  });

  sendSuccess(res, item, 'Cart updated');
};

export const removeFromCart = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.cartItem.delete({
    where: { userId_productId: { userId: req.user!.userId, productId: req.params.productId } },
  });
  sendSuccess(res, null, 'Item removed');
};

export const clearCart = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.cartItem.deleteMany({ where: { userId: req.user!.userId } });
  sendSuccess(res, null, 'Cart cleared');
};
