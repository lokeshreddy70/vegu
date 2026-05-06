import { Router } from 'express';
import { prisma } from '../prisma/client';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', async (_req, res) => {
  const banners = await prisma.banner.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } });
  sendSuccess(res, banners);
});

export default router;
