import { Response } from 'express';
import { prisma } from '../prisma/client';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../types';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  sendSuccess(res, notifications);
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { id: req.params.id, userId: req.user!.userId },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'Marked as read');
};

export const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.userId, isRead: false },
    data: { isRead: true },
  });
  sendSuccess(res, null, 'All marked as read');
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  const count = await prisma.notification.count({
    where: { userId: req.user!.userId, isRead: false },
  });
  sendSuccess(res, { count });
};

// Internal helper — not an HTTP handler
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type = 'info',
  data?: Record<string, unknown>
) => {
  await prisma.notification.create({
    data: { userId, title, message, type, data: (data ?? {}) as object },
  });
};
