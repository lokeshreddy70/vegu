import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendPaginated } from '../../utils/response';

const SETTING_KEYS = [
  'storeName', 'storeEmail', 'storePhone', 'storeCurrency', 'storeTimezone',
  'minOrderAmount', 'deliveryFee', 'freeDeliveryThreshold', 'taxRate', 'maintenanceMode',
] as const;

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  const rows = await prisma.setting.findMany();
  const data: Record<string, string | number | boolean> = {};
  for (const row of rows) {
    if (row.key === 'maintenanceMode') data[row.key] = row.value === 'true';
    else if (['minOrderAmount', 'deliveryFee', 'freeDeliveryThreshold', 'taxRate'].includes(row.key)) data[row.key] = parseFloat(row.value);
    else data[row.key] = row.value;
  }
  sendSuccess(res, data);
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  const updates = Object.entries(body)
    .filter(([key]) => (SETTING_KEYS as readonly string[]).includes(key))
    .map(([key, value]) => prisma.setting.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    }));
  await Promise.all(updates);
  sendSuccess(res, {}, 'Settings saved');
};

export const getLogs = async (_req: Request, res: Response): Promise<void> => {
  sendPaginated(res, [], 0, 1, 25);
};
