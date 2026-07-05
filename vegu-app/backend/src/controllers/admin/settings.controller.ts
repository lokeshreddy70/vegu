import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../prisma/client';
import { sendSuccess, sendPaginated } from '../../utils/response';

const SETTING_KEYS = [
  'storeName', 'storeEmail', 'storePhone', 'storeCurrency', 'storeTimezone',
  'minOrderAmount', 'deliveryFee', 'freeDeliveryThreshold', 'taxRate', 'maintenanceMode',
  'servicePauseUntil', 'servicePauseReason',
  'referralEnabled', 'referralRewardAmount', 'referralMinOrderValue', 'walletMaxUsagePercent',
  'supportPhone', 'supportWhatsApp', 'supportEmail', 'officeAddress', 'supportHours', 'emergencySupport',
  'aboutTitle', 'aboutDescription', 'contactTitle', 'contactDescription',
  'paymentMethods', 'faqJson',
  'privacyPolicy', 'termsAndConditions', 'riderSafetyPolicy', 'refundPolicy', 'cancellationPolicy', 'shippingPolicy',
] as const;

const pauseSchema = z.object({
  minutes: z.number().int().min(1).max(240).default(15),
  reason: z.string().max(200).optional(),
});

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  const rows = await prisma.setting.findMany();
  const data: Record<string, string | number | boolean> = {};
  for (const row of rows) {
    if (row.key === 'maintenanceMode') data[row.key] = row.value === 'true';
    else if (['minOrderAmount', 'deliveryFee', 'freeDeliveryThreshold', 'taxRate', 'referralRewardAmount', 'referralMinOrderValue', 'walletMaxUsagePercent'].includes(row.key)) data[row.key] = parseFloat(row.value);
    else if (row.key === 'referralEnabled') data[row.key] = row.value === 'true';
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

export const pauseService = async (req: Request, res: Response): Promise<void> => {
  const parsed = pauseSchema.parse(req.body);
  const until = new Date(Date.now() + parsed.minutes * 60_000);

  await Promise.all([
    prisma.setting.upsert({ where: { key: 'maintenanceMode' }, create: { key: 'maintenanceMode', value: 'true' }, update: { value: 'true' } }),
    prisma.setting.upsert({ where: { key: 'servicePauseUntil' }, create: { key: 'servicePauseUntil', value: until.toISOString() }, update: { value: until.toISOString() } }),
    prisma.setting.upsert({ where: { key: 'servicePauseReason' }, create: { key: 'servicePauseReason', value: parsed.reason || 'Operational hold' }, update: { value: parsed.reason || 'Operational hold' } }),
  ]);

  sendSuccess(res, { until: until.toISOString(), reason: parsed.reason || 'Operational hold' }, `Service paused for ${parsed.minutes} minutes`);
};

export const resumeService = async (_req: Request, res: Response): Promise<void> => {
  await Promise.all([
    prisma.setting.upsert({ where: { key: 'maintenanceMode' }, create: { key: 'maintenanceMode', value: 'false' }, update: { value: 'false' } }),
    prisma.setting.upsert({ where: { key: 'servicePauseUntil' }, create: { key: 'servicePauseUntil', value: '' }, update: { value: '' } }),
    prisma.setting.upsert({ where: { key: 'servicePauseReason' }, create: { key: 'servicePauseReason', value: '' }, update: { value: '' } }),
  ]);

  sendSuccess(res, {}, 'Service resumed');
};

export const getLogs = async (_req: Request, res: Response): Promise<void> => {
  sendPaginated(res, [], 0, 1, 25);
};
