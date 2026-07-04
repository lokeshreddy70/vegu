import { Response } from 'express';
import { z } from 'zod';
import { SupportSenderRole, SupportTicketCategory, SupportTicketPriority, SupportTicketStatus } from '@prisma/client';
import { prisma } from '../../prisma/client';
import { sendError, sendPaginated, sendSuccess } from '../../utils/response';
import { AuthRequest } from '../../types';

const querySchema = z.object({
  status: z.nativeEnum(SupportTicketStatus).optional(),
  priority: z.nativeEnum(SupportTicketPriority).optional(),
  category: z.nativeEnum(SupportTicketCategory).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});

const updateSchema = z.object({
  status: z.nativeEnum(SupportTicketStatus).optional(),
  priority: z.nativeEnum(SupportTicketPriority).optional(),
  assignedAdminId: z.string().nullable().optional(),
});

const replySchema = z.object({
  body: z.string().min(2).max(4000),
  markWaiting: z.boolean().optional(),
  markResolved: z.boolean().optional(),
});

export const getSupportOverview = async (_req: AuthRequest, res: Response): Promise<void> => {
  const [open, urgent, waiting, resolvedToday] = await Promise.all([
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.supportTicket.count({ where: { priority: 'URGENT', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
    prisma.supportTicket.count({ where: { status: 'WAITING_FOR_CUSTOMER' } }),
    prisma.supportTicket.count({ where: { resolvedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  sendSuccess(res, { open, urgent, waiting, resolvedToday });
};

export const getSupportTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    sendError(res, 'Invalid filters', 400, parsed.error.flatten());
    return;
  }

  const { status, priority, category, search, page, limit } = parsed.data;
  const where = {
    ...(status ? { status } : {}),
    ...(priority ? { priority } : {}),
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { summary: { contains: search, mode: 'insensitive' as const } },
            { lastMessagePreview: { contains: search, mode: 'insensitive' as const } },
            { order: { orderNumber: { contains: search, mode: 'insensitive' as const } } },
            { user: { email: { contains: search, mode: 'insensitive' as const } } },
            { user: { name: { contains: search, mode: 'insensitive' as const } } },
          ],
        }
      : {}),
  };

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        assignedAdmin: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, orderNumber: true, status: true, total: true, paymentStatus: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);

  sendPaginated(res, tickets, total, page, limit);
};

export const getSupportTicketDetail = async (req: AuthRequest, res: Response): Promise<void> => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, role: true } },
      assignedAdmin: { select: { id: true, name: true, email: true } },
      order: {
        include: {
          deliveryPartner: {
            include: { user: { select: { name: true, phone: true } } },
          },
          vendor: { select: { storeName: true } },
          address: true,
          items: { select: { quantity: true, name: true, price: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  if (!ticket) {
    sendError(res, 'Support ticket not found', 404);
    return;
  }

  sendSuccess(res, ticket);
};

export const updateSupportTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid update', 400, parsed.error.flatten());
    return;
  }

  const data = parsed.data;
  const updated = await prisma.supportTicket.update({
    where: { id: req.params.id },
    data: {
      ...(data.status ? { status: data.status, resolvedAt: data.status === 'RESOLVED' ? new Date() : null } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.assignedAdminId !== undefined ? { assignedAdminId: data.assignedAdminId } : {}),
    },
  });

  sendSuccess(res, updated, 'Support ticket updated');
};

export const replyToSupportTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = replySchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid reply', 400, parsed.error.flatten());
    return;
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id: req.params.id } });
  if (!ticket) {
    sendError(res, 'Support ticket not found', 404);
    return;
  }

  const { body, markResolved, markWaiting } = parsed.data;

  const updated = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      assignedAdminId: req.user!.userId,
      status: markResolved ? 'RESOLVED' : markWaiting ? 'WAITING_FOR_CUSTOMER' : 'IN_PROGRESS',
      resolvedAt: markResolved ? new Date() : null,
      lastMessagePreview: body,
      messages: {
        create: {
          senderId: req.user!.userId,
          senderRole: SupportSenderRole.ADMIN,
          body,
        },
      },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { sender: { select: { id: true, name: true, email: true, role: true } } },
      },
    },
  });

  sendSuccess(res, updated, 'Reply sent');
};
