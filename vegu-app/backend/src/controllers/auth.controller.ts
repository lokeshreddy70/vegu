import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const register = async (req: Request, res: Response): Promise<void> => {
  const body = registerSchema.parse(req.body);

  const exists = await prisma.user.findUnique({ where: { email: body.email } });
  if (exists) {
    sendError(res, 'Email already registered', 409);
    return;
  }

  const password = await hashPassword(body.password);
  const user = await prisma.user.create({
    data: { ...body, password, isVerified: true },
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true },
  });

  const payload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  sendSuccess(res, { user, accessToken, refreshToken }, 'Registration successful', 201);
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: body.email },
    select: { id: true, email: true, name: true, role: true, phone: true, avatar: true, password: true, isActive: true },
  });

  if (!user || !(await comparePassword(body.password, user.password))) {
    sendError(res, 'Invalid email or password', 401);
    return;
  }

  if (!user.isActive) {
    sendError(res, 'Account is deactivated', 403);
    return;
  }

  const payload = { userId: user.id, role: user.role, email: user.email };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  const { password: _, ...safeUser } = user;
  sendSuccess(res, { user: safeUser, accessToken, refreshToken }, 'Login successful');
};

export const refreshTokens = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    sendError(res, 'Refresh token required', 400);
    return;
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    sendError(res, 'Invalid or expired refresh token', 401);
    return;
  }

  const payload = verifyRefreshToken(refreshToken);
  const accessToken = generateAccessToken({ userId: payload.userId, role: payload.role, email: payload.email });
  const newRefresh = generateRefreshToken({ userId: payload.userId, role: payload.role, email: payload.email });

  await prisma.refreshToken.update({
    where: { token: refreshToken },
    data: { token: newRefresh, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
  });

  sendSuccess(res, { accessToken, refreshToken: newRefresh }, 'Tokens refreshed');
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }
  sendSuccess(res, null, 'Logged out successfully');
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true, email: true, name: true, role: true, phone: true, avatar: true,
      isVerified: true, loyaltyPoints: true, referralCode: true,
      addresses: true,
      vendor: { select: { id: true, storeName: true, storeSlug: true, status: true, isActive: true } },
    },
  });
  if (!user) {
    sendError(res, 'User not found', 404);
    return;
  }
  sendSuccess(res, user);
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    avatar: z.string().url().optional(),
  });
  const body = schema.parse(req.body);
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: body,
    select: { id: true, email: true, name: true, phone: true, avatar: true, role: true },
  });
  sendSuccess(res, user, 'Profile updated');
};
