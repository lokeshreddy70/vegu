import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(getCart));
router.post('/', asyncHandler(addToCart));
router.patch('/:productId', asyncHandler(updateCartItem));
router.delete('/:productId', asyncHandler(removeFromCart));
router.delete('/', asyncHandler(clearCart));

export default router;
