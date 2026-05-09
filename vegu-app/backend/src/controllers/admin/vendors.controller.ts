import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendPaginated } from '../../utils/response';

export const getVendors = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(String(req.query.page || '1')) || 1);
  const limit = 20;
  const status = req.query.status as string | undefined;
  const search = typeof req.query.search === 'string' ? req.query.search.slice(0, 100) : undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) where.OR = [
    { storeName: { contains: search, mode: 'insensitive' } },
    { user: { name: { contains: search, mode: 'insensitive' } } },
  ];

  const [vendors, total] = await Promise.all([
    prisma.vendor.findMany({
      where,
      include: { user: { select: { name: true, email: true, phone: true } }, _count: { select: { products: true, orders: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.vendor.count({ where }),
  ]);
  sendPaginated(res, vendors, total, page, limit);
};

export const updateVendorStatus = async (req: Request, res: Response): Promise<void> => {
  const { status } = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'SUSPENDED']) }).parse(req.body);

  const vendor = await prisma.$transaction(async (tx) => {
    const updated = await tx.vendor.update({
      where: { id: req.params.id },
      data: { status, isActive: status === 'APPROVED' },
      include: { user: { select: { name: true, email: true, id: true } } },
    });
    if (status === 'APPROVED') {
      await tx.user.update({ where: { id: updated.userId }, data: { role: 'VENDOR' } });
    }
    return updated;
  });

  sendSuccess(res, vendor, `Vendor ${status.toLowerCase()}`);
};
