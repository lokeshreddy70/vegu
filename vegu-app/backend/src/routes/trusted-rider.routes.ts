import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getRiderPublicProfile,
  rateRider,
  toggleFavoriteRider,
  getFavoriteRiders,
  getRatingStatus,
} from '../controllers/trusted-rider.controller';

const router = Router();

// Public — no auth needed
router.get('/profile/:partnerId', getRiderPublicProfile);

// Authenticated customers
router.post('/rate/:orderId', authenticate, rateRider);
router.get('/rate-status/:orderId', authenticate, getRatingStatus);
router.post('/favorites/toggle/:partnerId', authenticate, toggleFavoriteRider);
router.get('/favorites', authenticate, getFavoriteRiders);

export default router;
