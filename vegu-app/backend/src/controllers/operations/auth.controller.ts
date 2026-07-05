import { Request, Response } from 'express';
import { z } from 'zod';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../../prisma/client';
import { comparePassword, hashPassword } from '../../utils/password';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { sendError, sendSuccess } from '../../utils/response';
import { config } from '../../config';
import { AuthRequest } from '../../types';
import { OPS_ROLES } from '../../utils/ops-roles';

const loginSchema = z.object({
  identifier: z.string().min(3).max(120),
  password: z.string().min(1),
});

const forgotSchema = z.object({
  identifier: z.string().min(3).max(120),
});

const resetSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8).max(100),
});

const refreshExpiresAt = (): Date => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

export const operationsLogin = async (req: Request, res: Response): Promise<void> => {
  const body = loginSchema.parse(req.body);
  const identifier = body.identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: body.identifier.trim() }],
    },
    include: { staffProfile: true },
  });

  if (!user || !OPS_ROLES.includes(user.role) || !(await comparePassword(body.password, user.password))) {
    sendError(res, 'Invalid credentials', 401);
    return;
  }

  if (!user.isActive || user.staffProfile?.status === 'BLOCKED') {
    sendError(res, 'Account is blocked', 403);
    return;
  }

  const payload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: refreshExpiresAt(),
      device: req.headers['user-agent']?.slice(0, 200) || 'operations-web',
    },
  });

  await prisma.staffProfile.updateMany({
    where: { userId: user.id },
    data: { lastLoginAt: new Date() },
  });

  sendSuccess(
    res,
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        staffProfile: user.staffProfile,
      },
      accessToken,
      refreshToken,
    },
    'Operations login successful',
  );
};

export const operationsForgotPassword = async (req: Request, res: Response): Promise<void> => {
  const body = forgotSchema.parse(req.body);
  const identifier = body.identifier.trim().toLowerCase();

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: body.identifier.trim() }],
      role: { in: OPS_ROLES },
    },
  });

  if (!user) {
    sendSuccess(res, null, 'If account exists, reset instructions are issued');
    return;
  }

  const rawToken = randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  const data: Record<string, unknown> = {};
  if (config.isDev) {
    data.devResetToken = rawToken;
  }

  sendSuccess(res, data, 'If account exists, reset instructions are issued');
};

export const operationsResetPassword = async (req: Request, res: Response): Promise<void> => {
  const body = resetSchema.parse(req.body);
  const tokenHash = hashToken(body.token);

  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!resetToken) {
    sendError(res, 'Invalid or expired reset token', 400);
    return;
  }

  const password = await hashPassword(body.newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: resetToken.userId }, data: { password } }),
    prisma.passwordResetToken.update({ where: { id: resetToken.id }, data: { usedAt: new Date() } }),
    prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
  ]);

  sendSuccess(res, null, 'Password reset successful');
};

export const operationsMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      staffProfile: {
        select: {
          id: true,
          storeId: true,
          employeeCode: true,
          status: true,
          lastLoginAt: true,
          store: { select: { id: true, name: true, code: true, city: true } },
        },
      },
    },
  });

  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }

  sendSuccess(res, user);
};
