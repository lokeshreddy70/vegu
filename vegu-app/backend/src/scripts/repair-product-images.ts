import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { resolveCanonicalProductImage } from '../utils/product-images';

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, slug: true, images: true },
  });

  let updated = 0;
  for (const product of products) {
    const resolved = resolveCanonicalProductImage(product.slug, product.images);
    if (!resolved) continue;

    const nextImages = [resolved];
    const current = JSON.stringify(product.images ?? []);
    const next = JSON.stringify(nextImages);
    if (current === next) continue;

    await prisma.product.update({
      where: { id: product.id },
      data: { images: nextImages },
    });
    updated++;
  }

  console.log(`Updated ${updated} product image records.`);
}

main()
  .catch((error) => {
    console.error('Failed to repair product images', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
