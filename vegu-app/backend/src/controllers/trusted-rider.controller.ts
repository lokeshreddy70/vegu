import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma/client';
import { sendSuccess, sendError } from '../utils/response';
import { AuthRequest } from '../types';

// ── Trust badge derived from delivery count ─────────────────────────────────
export function getTrustBadge(deliveries: number): { label: string; tier: number } {
  if (deliveries >= 500) return { label: 'Elite', tier: 4 };
  if (deliveries >= 200) return { label: 'Trusted', tier: 3 };
  if (deliveries >= 50)  return { label: 'Reliable', tier: 2 };
  return { label: 'Rookie', tier: 1 };
}

// ── Public rider profile ────────────────────────────────────────────────────
export const getRiderPublicProfile = async (req: Request, res: Response): Promise<void> => {
  const { partnerId } = req.params;

  const partner = await prisma.deliveryPartner.findUnique({
    where: { id: partnerId },
    include: {
      user: { select: { name: true, avatar: true } },
      riderRatings: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!partner) {
    sendError(res, 'Rider not found', 404);
    return;
  }

  const badge = getTrustBadge(partner.totalDeliveries);

  sendSuccess(res, {
    id: partner.id,
    name: partner.user.name,
    avatar: partner.user.avatar,
    vehicleType: partner.vehicleType,
    rating: partner.rating,
    ratingCount: partner.ratingCount,
    totalDeliveries: partner.totalDeliveries,
    badge,
    recentReviews: partner.riderRatings.map(r => ({
      rating: r.rating,
      comment: r.comment,
      reviewerName: r.user.name.split(' ')[0],
      createdAt: r.createdAt,
    })),
  });
};

// ── Rate a rider ────────────────────────────────────────────────────────────
const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(300).optional(),
});

export const rateRider = async (req: AuthRequest, res: Response): Promise<void> => {
  const parsed = ratingSchema.safeParse(req.body);
  if (!parsed.success) {
    sendError(res, 'Invalid rating', 400, parsed.error.flatten());
    return;
  }

  const { orderId } = req.params;

  // Validate order belongs to user and has a rider
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: req.user!.userId, status: 'DELIVERED' },
    select: { deliveryPartnerId: true },
  });

  if (!order?.deliveryPartnerId) {
    sendError(res, 'Order not eligible for rating', 400);
    return;
  }

  const existing = await prisma.riderRating.findUnique({ where: { orderId } });
  if (existing) {
    sendError(res, 'Already rated this delivery', 409);
    return;
  }

  await prisma.riderRating.create({
    data: {
      userId: req.user!.userId,
      deliveryPartnerId: order.deliveryPartnerId,
      orderId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    },
  });

  // Recalculate average rating
  const agg = await prisma.riderRating.aggregate({
    where: { deliveryPartnerId: order.deliveryPartnerId },
    _avg: { rating: true },
    _count: true,
  });

  await prisma.deliveryPartner.update({
    where: { id: order.deliveryPartnerId },
    data: {
      rating: Math.round((agg._avg.rating ?? 0) * 10) / 10,
      ratingCount: agg._count,
    },
  });

  sendSuccess(res, {}, 'Thank you for your feedback!');
};

// ── Toggle favorite rider ───────────────────────────────────────────────────
export const toggleFavoriteRider = async (req: AuthRequest, res: Response): Promise<void> => {
  const { partnerId } = req.params;

  const partner = await prisma.deliveryPartner.findUnique({ where: { id: partnerId } });
  if (!partner) {
    sendError(res, 'Rider not found', 404);
    return;
  }

  const existing = await prisma.favoriteRider.findUnique({
    where: { userId_deliveryPartnerId: { userId: req.user!.userId, deliveryPartnerId: partnerId } },
  });

  if (existing) {
    await prisma.favoriteRider.delete({ where: { id: existing.id } });
    sendSuccess(res, { favorited: false }, 'Removed from favorites');
  } else {
    await prisma.favoriteRider.create({
      data: { userId: req.user!.userId, deliveryPartnerId: partnerId },
    });
    sendSuccess(res, { favorited: true }, 'Added to favorites');
  }
};

// ── Get user's favorite riders ──────────────────────────────────────────────
export const getFavoriteRiders = async (req: AuthRequest, res: Response): Promise<void> => {
  const favorites = await prisma.favoriteRider.findMany({
    where: { userId: req.user!.userId },
    include: {
      deliveryPartner: {
        include: { user: { select: { name: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const riders = favorites.map(f => ({
    id: f.deliveryPartner.id,
    name: f.deliveryPartner.user.name,
    avatar: f.deliveryPartner.user.avatar,
    vehicleType: f.deliveryPartner.vehicleType,
    rating: f.deliveryPartner.rating,
    totalDeliveries: f.deliveryPartner.totalDeliveries,
    badge: getTrustBadge(f.deliveryPartner.totalDeliveries),
    favoritedAt: f.createdAt,
  }));

  sendSuccess(res, riders);
};

// ── Check if an order's rider has been rated ────────────────────────────────
export const getRatingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { orderId } = req.params;
  const rating = await prisma.riderRating.findUnique({ where: { orderId } });
  sendSuccess(res, { rated: !!rating, rating: rating?.rating ?? null });
};
