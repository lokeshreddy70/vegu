import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';

export const getMyWallet = async (req: AuthRequest, res: Response): Promise<void> => {
  const wallet = await prisma.wallet.upsert({
    where: { userId: req.user!.userId },
    update: {},
    create: { userId: req.user!.userId, balance: 0 },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 100,
      },
    },
  });

  const earned = wallet.transactions.filter((t) => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0);
  const used = wallet.transactions.filter((t) => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0);

  sendSuccess(res, {
    balance: wallet.balance,
    earned,
    used,
    transactions: wallet.transactions,
  });
};
