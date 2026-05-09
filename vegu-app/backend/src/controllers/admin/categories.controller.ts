import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendError } from '../../utils/response';

const categorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  image: z.string().url().optional(),
  icon: z.string().max(10).optional(),
  color: z.string().max(20).optional(),
  parentId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  const withCounts = req.query.counts !== 'false';
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: withCounts ? { select: { products: true } } : undefined,
      children: { select: { id: true, name: true, slug: true, isActive: true } },
    },
  });
  sendSuccess(res, categories);
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const body = categorySchema.parse(req.body);
  const slug = body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const category = await prisma.category.create({ data: { ...body, slug } });
  sendSuccess(res, category, 'Category created', 201);
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const body = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({ where: { id: req.params.id }, data: body });
  sendSuccess(res, category, 'Category updated');
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const count = await prisma.product.count({ where: { categoryId: req.params.id } });
  if (count > 0) { sendError(res, `Cannot delete: ${count} products assigned to this category`, 400); return; }
  await prisma.category.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Category deleted');
};
