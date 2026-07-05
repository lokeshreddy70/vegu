import { Response } from 'express';
import { z } from 'zod';
import { InventoryAdjustmentType } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { sendError, sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../types';
import { resolveStaffScope } from './helpers';

const stockSchema = z.object({
  stock: z.number().int().min(0),
  reason: z.string().max(250).optional(),
  adjustmentType: z.nativeEnum(InventoryAdjustmentType).default('MANUAL_CORRECTION'),
});

export const getOperationsInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);

  const products = await prisma.product.findMany({
    where: {
      ...(scope.storeId ? { storeId: scope.storeId } : {}),
    },
    orderBy: [{ stock: 'asc' }, { updatedAt: 'desc' }],
    include: {
      category: { select: { id: true, name: true } },
      vendor: { select: { id: true, storeName: true } },
      store: { select: { id: true, name: true, code: true } },
    },
    take: 300,
  });

  sendSuccess(res, products);
};

export const updateOperationsInventoryStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = stockSchema.parse(req.body);
  const scope = await resolveStaffScope(req.user!.userId, req.user!.role);

  const product = await prisma.product.findFirst({
    where: {
      id: req.params.id,
      ...(scope.storeId ? { storeId: scope.storeId } : {}),
    },
  });

  if (!product) {
    sendError(res, 'Product not found', 404);
    return;
  }

  const delta = body.stock - product.stock;

  const updated = await prisma.$transaction(async (tx) => {
    const p = await tx.product.update({
      where: { id: product.id },
      data: {
        stock: body.stock,
        isAvailable: body.stock > 0,
      },
    });

    if (product.storeId) {
      await tx.inventoryAdjustment.create({
        data: {
          storeId: product.storeId,
          productId: product.id,
          quantity: delta,
          type: body.adjustmentType,
          reason: body.reason,
          createdById: req.user!.userId,
        },
      });
    }

    return p;
  });

  sendSuccess(res, updated, 'Inventory updated');
};
