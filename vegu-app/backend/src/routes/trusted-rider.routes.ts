import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getRiderPublicProfile,
  rateRider,
  toggleFavoriteRider,
  getFavoriteRiders,
  getRatingStatus,
} from '../controllers/trusted-rider.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/profile/:partnerId', asyncHandler(getRiderPublicProfile));
router.post('/rate/:orderId', authenticate, asyncHandler(rateRider));
router.get('/rate-status/:orderId', authenticate, asyncHandler(getRatingStatus));
router.post('/favorites/toggle/:partnerId', authenticate, asyncHandler(toggleFavoriteRider));
router.get('/favorites', authenticate, asyncHandler(getFavoriteRiders));

export default router;
