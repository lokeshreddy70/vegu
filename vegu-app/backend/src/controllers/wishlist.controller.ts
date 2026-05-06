import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

export const getWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.userId },
    include: {
      product: {
        select: {
          id: true, name: true, slug: true, price: true, comparePrice: true,
          images: true, unit: true, stock: true, isAvailable: true,
          discount: true, rating: true, reviewCount: true, isFeatured: true, isTrending: true,
          category: { select: { name: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  sendSuccess(res, items);
};

export const addToWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId } = z.object({ productId: z.string() }).parse(req.body);

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    sendError(res, 'Product not found', 404);
    return;
  }

  const item = await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: req.user!.userId, productId } },
    update: {},
    create: { userId: req.user!.userId, productId },
  });
  sendSuccess(res, item, 'Added to wishlist', 201);
};

export const removeFromWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const result = await prisma.wishlistItem.deleteMany({
    where: { userId: req.user!.userId, productId },
  });
  if (result.count === 0) {
    sendError(res, 'Item not in wishlist', 404);
    return;
  }
  sendSuccess(res, null, 'Removed from wishlist');
};

export const checkWishlist = async (req: AuthRequest, res: Response): Promise<void> => {
  const { productId } = req.params;
  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId: req.user!.userId, productId } },
  });
  sendSuccess(res, { isWishlisted: !!item });
};
