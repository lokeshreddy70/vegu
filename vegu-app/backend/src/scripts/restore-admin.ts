/**
 * Run this once against production DB to restore the admin account role.
 * Usage: DATABASE_URL="<prod_url>" npx tsx src/scripts/restore-admin.ts
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Restoring admin accounts...\n');

  // Find all users named "VEGU Admin" or with admin email that got downgraded to DELIVERY
  const affected = await prisma.user.findMany({
    where: {
      OR: [
        { email: 'admin@vegu.app' },
        { name: 'VEGU Admin' },
      ],
    },
    select: { id: true, email: true, name: true, role: true },
  });

  if (affected.length === 0) {
    console.log('No admin accounts found to restore.');
    return;
  }

  for (const u of affected) {
    console.log(`Found: ${u.email} (${u.name}) — current role: ${u.role}`);

    if (u.role !== 'ADMIN') {
      await prisma.user.update({
        where: { id: u.id },
        data: { role: 'ADMIN' },
      });
      // Also clean up any accidental DeliveryPartner record
      await prisma.deliveryPartner.deleteMany({ where: { userId: u.id } });
      // Revoke all sessions so they have to log in fresh with correct role
      await prisma.refreshToken.deleteMany({ where: { userId: u.id } });
      console.log(`  ✓ Restored to ADMIN, removed delivery partner record, cleared sessions`);
    } else {
      console.log(`  ✓ Already ADMIN — no change needed`);
    }
  }

  console.log('\nDone. Admin must log in fresh at /login to get a new token with ADMIN role.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
