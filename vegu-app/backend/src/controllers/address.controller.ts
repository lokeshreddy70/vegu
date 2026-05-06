import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

const addressSchema = z.object({
  label: z.string().default('Home'),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6),
  isDefault: z.boolean().default(false),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const getAddresses = async (req: AuthRequest, res: Response): Promise<void> => {
  const addresses = await prisma.address.findMany({ where: { userId: req.user!.userId }, orderBy: { isDefault: 'desc' } });
  sendSuccess(res, addresses);
};

export const createAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = addressSchema.parse(req.body);
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
  }
  const address = await prisma.address.create({ data: { ...body, userId: req.user!.userId } });
  sendSuccess(res, address, 'Address added', 201);
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = addressSchema.partial().parse(req.body);
  if (body.isDefault) {
    await prisma.address.updateMany({ where: { userId: req.user!.userId }, data: { isDefault: false } });
  }
  const address = await prisma.address.updateMany({ where: { id: req.params.id, userId: req.user!.userId }, data: body });
  if (address.count === 0) {
    sendError(res, 'Address not found', 404);
    return;
  }
  sendSuccess(res, null, 'Address updated');
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
  const result = await prisma.address.deleteMany({ where: { id: req.params.id, userId: req.user!.userId } });
  if (result.count === 0) {
    sendError(res, 'Address not found', 404);
    return;
  }
  sendSuccess(res, null, 'Address deleted');
};
