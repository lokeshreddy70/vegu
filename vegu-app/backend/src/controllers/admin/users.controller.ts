import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response';

const safePage = (raw: unknown) => Math.max(1, parseInt(String(raw || '1')) || 1);
const safeSearch = (raw: unknown) => typeof raw === 'string' ? raw.slice(0, 100) : undefined;

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const page = safePage(req.query.page);
  const limit = 20;
  const search = safeSearch(req.query.search);
  const role = req.query.role as string | undefined;

  const where: Record<string, unknown> = {};
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { email: { contains: search, mode: 'insensitive' } },
  ];
  if (role) where.role = role;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, email: true, phone: true, role: true,
        isActive: true, createdAt: true, avatar: true, loyaltyPoints: true,
        _count: { select: { orders: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);
  sendPaginated(res, users, total, page, limit);
};

export const getUserDetail = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      orders: { take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, orderNumber: true, status: true, total: true, createdAt: true } },
      addresses: true,
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!user) { sendError(res, 'User not found', 404); return; }
  const spending = await prisma.order.aggregate({ where: { userId: req.params.id, status: 'DELIVERED' }, _sum: { total: true } });
  sendSuccess(res, { ...user, totalSpending: spending._sum.total || 0 });
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) { sendError(res, 'User not found', 404); return; }
  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
  sendSuccess(res, { isActive: updated.isActive }, `User ${updated.isActive ? 'activated' : 'deactivated'}`);
};
