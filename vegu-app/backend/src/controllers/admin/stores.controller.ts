import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendError, sendSuccess } from '../../utils/response';

const createSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z.string().min(2).max(120),
  code: z.string().min(2).max(30),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  managerUserId: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  city: z.string().min(2).max(80).optional(),
  state: z.string().min(2).max(80).optional(),
  address: z.string().max(300).optional(),
  phone: z.string().max(20).optional(),
  isActive: z.boolean().optional(),
  managerUserId: z.string().nullable().optional(),
});

export const listStores = async (_req: Request, res: Response): Promise<void> => {
  const stores = await prisma.store.findMany({
    include: {
      manager: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { staff: true, products: true, orders: true, vendors: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, stores);
};

export const createStore = async (req: Request, res: Response): Promise<void> => {
  const body = createSchema.parse(req.body);

  if (body.managerUserId) {
    const manager = await prisma.user.findUnique({ where: { id: body.managerUserId } });
    if (!manager || !['STORE_MANAGER', 'OWNER', 'ADMIN'].includes(manager.role)) {
      sendError(res, 'Invalid manager user', 400);
      return;
    }
  }

  const store = await prisma.store.create({
    data: {
      name: body.name,
      slug: body.slug.toLowerCase().replace(/\s+/g, '-'),
      code: body.code.toUpperCase(),
      city: body.city,
      state: body.state,
      address: body.address,
      phone: body.phone,
      managerId: body.managerUserId,
    },
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
  });

  sendSuccess(res, store, 'Store created', 201);
};

export const updateStore = async (req: Request, res: Response): Promise<void> => {
  const body = updateSchema.parse(req.body);

  const exists = await prisma.store.findUnique({ where: { id: req.params.id } });
  if (!exists) {
    sendError(res, 'Store not found', 404);
    return;
  }

  const store = await prisma.store.update({
    where: { id: req.params.id },
    data: {
      ...body,
      ...(typeof body.managerUserId !== 'undefined' ? { managerId: body.managerUserId || null } : {}),
    },
    include: {
      manager: { select: { id: true, name: true, email: true, phone: true } },
      _count: { select: { staff: true, products: true, orders: true } },
    },
  });

  sendSuccess(res, store, 'Store updated');
};
