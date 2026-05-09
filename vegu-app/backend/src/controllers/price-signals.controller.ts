import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { sendSuccess } from '../utils/response';

type SignalType = 'PRICE_DROP' | 'HOT_DEAL' | 'LIMITED_STOCK' | 'TRENDING';

interface PriceSignal {
  type: SignalType;
  label: string;
  badge: string;
  color: string;
}

function getSignal(p: {
  price: number;
  comparePrice: number | null;
  discount: number;
  stock: number;
  isTrending: boolean;
}): PriceSignal | null {
  if (p.comparePrice && p.comparePrice > p.price) {
    const pct = Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100);
    return { type: 'PRICE_DROP', label: `↓ ${pct}% Price Drop`, badge: `↓${pct}%`, color: 'emerald' };
  }
  if (p.discount >= 20) {
    return { type: 'HOT_DEAL', label: `${p.discount}% Off — Hot Deal`, badge: `${p.discount}% OFF`, color: 'orange' };
  }
  if (p.stock > 0 && p.stock <= 10) {
    return { type: 'LIMITED_STOCK', label: `Only ${p.stock} left`, badge: `${p.stock} left`, color: 'amber' };
  }
  if (p.isTrending) {
    return { type: 'TRENDING', label: 'Trending now', badge: '🔥 Hot', color: 'red' };
  }
  return null;
}

export const getPriceSignals = async (_req: Request, res: Response): Promise<void> => {
  // Pull candidates in one query — apply signal logic in memory
  const products = await prisma.product.findMany({
    where: {
      isAvailable: true,
      stock: { gt: 0 },
      OR: [
        { comparePrice: { not: null } },
        { discount: { gte: 15 } },
        { stock: { lte: 15 } },
        { isTrending: true },
      ],
    },
    select: {
      id: true, name: true, slug: true, price: true, comparePrice: true,
      images: true, unit: true, stock: true, discount: true,
      rating: true, reviewCount: true, isTrending: true,
      category: { select: { name: true, slug: true } },
    },
    orderBy: { discount: 'desc' },
    take: 40,
  });

  const withSignals = products
    .map(p => {
      const signal = getSignal(p);
      if (!signal) return null;
      return { ...p, signal };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null)
    .slice(0, 20);

  // Group by signal type
  const grouped: Record<SignalType, typeof withSignals> = {
    PRICE_DROP: [],
    HOT_DEAL: [],
    LIMITED_STOCK: [],
    TRENDING: [],
  };
  for (const p of withSignals) {
    grouped[p.signal.type].push(p);
  }

  sendSuccess(res, { all: withSignals, grouped });
};
