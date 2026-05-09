import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(getWishlist));
router.post('/', asyncHandler(addToWishlist));
router.get('/:productId/check', asyncHandler(checkWishlist));
router.delete('/:productId', asyncHandler(removeFromWishlist));

export default router;
