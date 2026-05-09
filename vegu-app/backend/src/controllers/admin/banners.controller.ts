import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendSuccess } from '../../utils/response';

const bannerSchema = z.object({
  title: z.string().min(2).max(200),
  subtitle: z.string().max(300).optional(),
  image: z.string().url(),
  link: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const getBanners = async (_req: Request, res: Response): Promise<void> => {
  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: 'asc' } });
  sendSuccess(res, banners);
};

export const createBanner = async (req: Request, res: Response): Promise<void> => {
  const body = bannerSchema.parse(req.body);
  const banner = await prisma.banner.create({ data: body });
  sendSuccess(res, banner, 'Banner created', 201);
};

export const updateBanner = async (req: Request, res: Response): Promise<void> => {
  const body = bannerSchema.partial().parse(req.body);
  const banner = await prisma.banner.update({ where: { id: req.params.id }, data: body });
  sendSuccess(res, banner, 'Banner updated');
};

export const deleteBanner = async (req: Request, res: Response): Promise<void> => {
  await prisma.banner.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Banner deleted');
};
