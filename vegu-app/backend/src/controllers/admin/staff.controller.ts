import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { hashPassword } from '../../utils/password';
import { sendError, sendSuccess } from '../../utils/response';

const staffRoles: Role[] = ['OWNER', 'STORE_MANAGER', 'INVENTORY_MANAGER', 'PACKING_STAFF', 'SUPPORT_STAFF'];

const createSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().transform((v) => v.toLowerCase().trim()),
  phone: z.string().max(20).optional(),
  password: z.string().min(8).max(100),
  role: z.nativeEnum(Role).refine((r) => staffRoles.includes(r), 'Invalid staff role'),
  storeId: z.string().min(1),
});

const updateSchema = z.object({
  role: z.nativeEnum(Role).refine((r) => staffRoles.includes(r), 'Invalid staff role').optional(),
  storeId: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
  isActive: z.boolean().optional(),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8).max(100),
});

export const listStaff = async (req: Request, res: Response): Promise<void> => {
  const storeId = typeof req.query.storeId === 'string' ? req.query.storeId : undefined;

  const staff = await prisma.staffProfile.findMany({
    where: storeId ? { storeId } : {},
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true } },
      store: { select: { id: true, name: true, code: true, city: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  sendSuccess(res, staff);
};

export const createStaff = async (req: Request, res: Response): Promise<void> => {
  const body = createSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    sendError(res, 'Email already exists', 409);
    return;
  }

  const store = await prisma.store.findUnique({ where: { id: body.storeId } });
  if (!store) {
    sendError(res, 'Store not found', 404);
    return;
  }

  const password = await hashPassword(body.password);

  const staff = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: body.name,
        email: body.email,
        phone: body.phone,
        password,
        role: body.role,
        isVerified: true,
        isActive: true,
      },
    });

    const profile = await tx.staffProfile.create({
      data: {
        userId: user.id,
        storeId: body.storeId,
        employeeCode: `VEGU-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        createdById: (req as { user?: { userId: string } }).user?.userId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, phone: true, isActive: true } },
        store: { select: { id: true, name: true, code: true, city: true } },
      },
    });

    if (body.role === 'STORE_MANAGER') {
      await tx.store.update({ where: { id: body.storeId }, data: { managerId: user.id } });
    }

    return profile;
  });

  sendSuccess(res, staff, 'Staff account created', 201);
};

export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  const body = updateSchema.parse(req.body);

  const profile = await prisma.staffProfile.findUnique({
    where: { userId: req.params.id },
    include: { user: true },
  });

  if (!profile) {
    sendError(res, 'Staff not found', 404);
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: req.params.id },
      data: {
        ...(body.role ? { role: body.role } : {}),
        ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
      },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    const staffProfile = await tx.staffProfile.update({
      where: { userId: req.params.id },
      data: {
        ...(body.storeId ? { storeId: body.storeId } : {}),
        ...(body.status ? { status: body.status } : {}),
      },
      include: {
        store: { select: { id: true, name: true, code: true, city: true } },
      },
    });

    return { user, staffProfile };
  });

  sendSuccess(res, updated, 'Staff updated');
};

export const resetStaffPassword = async (req: Request, res: Response): Promise<void> => {
  const body = resetPasswordSchema.parse(req.body);

  const profile = await prisma.staffProfile.findUnique({ where: { userId: req.params.id } });
  if (!profile) {
    sendError(res, 'Staff not found', 404);
    return;
  }

  const password = await hashPassword(body.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: req.params.id }, data: { password } }),
    prisma.refreshToken.deleteMany({ where: { userId: req.params.id } }),
  ]);

  sendSuccess(res, null, 'Staff password reset successful');
};

export const removeStaff = async (req: Request, res: Response): Promise<void> => {
  const profile = await prisma.staffProfile.findUnique({ where: { userId: req.params.id } });
  if (!profile) {
    sendError(res, 'Staff not found', 404);
    return;
  }

  await prisma.$transaction([
    prisma.refreshToken.deleteMany({ where: { userId: req.params.id } }),
    prisma.staffProfile.delete({ where: { userId: req.params.id } }),
    prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } }),
  ]);

  sendSuccess(res, null, 'Staff removed successfully');
};
