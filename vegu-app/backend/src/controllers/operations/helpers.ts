import { Role } from '@prisma/client';
import { prisma } from '../../prisma/client';

export async function resolveStaffScope(userId: string, role: Role): Promise<{ storeId?: string; global: boolean }> {
  if (role === 'ADMIN' || role === 'OWNER') {
    return { global: true };
  }

  const profile = await prisma.staffProfile.findUnique({
    where: { userId },
    select: { storeId: true, status: true },
  });

  if (!profile || profile.status === 'BLOCKED') {
    return { global: false };
  }

  return { global: false, storeId: profile.storeId };
}
