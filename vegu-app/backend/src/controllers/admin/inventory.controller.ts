import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendPaginated } from '../../utils/response';

export const getInventory = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
  const limit = 30;
  const filter = req.query.filter as string | undefined;

  const where: Record<string, unknown> = {};
  if (filter === 'low') where.stock = { gt: 0, lte: 10 };
  else if (filter === 'out') where.stock = 0;
  else if (filter === 'healthy') where.stock = { gt: 10 };

  const [products, total, outOfStock, lowStock, healthy] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, name: true, sku: true, stock: true, unit: true,
        images: true, isAvailable: true, price: true,
        category: { select: { name: true } },
        vendor: { select: { storeName: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { stock: 'asc' },
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { stock: 0 } }),
    prisma.product.count({ where: { stock: { gt: 0, lte: 10 } } }),
    prisma.product.count({ where: { stock: { gt: 10 } } }),
  ]);

  sendPaginated(res, products, total, page, limit, { outOfStock, lowStock, healthy });
};

export const updateStock = async (req: Request, res: Response): Promise<void> => {
  const { stock } = z.object({ stock: z.number().int().min(0) }).parse(req.body);
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { stock, isAvailable: stock > 0 },
  });
  sendSuccess(res, { stock: product.stock, isAvailable: product.isAvailable }, 'Stock updated');
};
