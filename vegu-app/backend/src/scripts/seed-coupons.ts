import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

const COUPONS = [
  {
    code: 'VEGU10',
    description: '10% off on your order',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 100,
    maxDiscount: 50,
    isActive: true,
  },
  {
    code: 'VEGU20',
    description: '20% off on orders above ₹300',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 300,
    maxDiscount: 100,
    isActive: true,
  },
  {
    code: 'FRESH50',
    description: 'Flat ₹50 off on your first order',
    discountType: 'flat',
    discountValue: 50,
    minOrderValue: 200,
    isActive: true,
  },
  {
    code: 'SAVE100',
    description: 'Flat ₹100 off on orders above ₹500',
    discountType: 'flat',
    discountValue: 100,
    minOrderValue: 500,
    isActive: true,
  },
  {
    code: 'FREEDEL',
    description: '₹40 delivery fee waived on any order',
    discountType: 'flat',
    discountValue: 40,
    minOrderValue: 1,
    isActive: true,
  },
];

async function main() {
  console.log('Seeding coupons...');
  for (const coupon of COUPONS) {
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: { ...coupon },
      create: { ...coupon },
    });
    console.log(`✓ ${coupon.code}`);
  }
  console.log('Done!');
}

main().finally(() => prisma.$disconnect());
