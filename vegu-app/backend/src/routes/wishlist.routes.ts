import { Router } from 'express';
import { getWishlist, addToWishlist, removeFromWishlist, checkWishlist } from '../controllers/wishlist.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getWishlist);
router.post('/', addToWishlist);
router.get('/:productId/check', checkWishlist);
router.delete('/:productId', removeFromWishlist);

export default router;
