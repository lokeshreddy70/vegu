import { Role } from '@prisma/client';

export const OPS_ROLES: Role[] = [
  'OWNER',
  'STORE_MANAGER',
  'INVENTORY_MANAGER',
  'PACKING_STAFF',
  'SUPPORT_STAFF',
  'ADMIN',
];

export const ADMIN_ROLES: Role[] = ['ADMIN', 'OWNER'];

export const canManageStores = (role: Role): boolean => role === 'ADMIN' || role === 'OWNER' || role === 'STORE_MANAGER';
