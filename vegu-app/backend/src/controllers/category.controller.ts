import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: { children: { where: { isActive: true } }, _count: { select: { products: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  sendSuccess(res, categories);
};

export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { children: true, _count: { select: { products: true } } },
  });
  if (!category) {
    sendError(res, 'Category not found', 404);
    return;
  }
  sendSuccess(res, category);
};
