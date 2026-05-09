import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { placeOrder, getMyOrders, getOrderById, cancelOrder } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

// Tight rate limit on order creation: 10 orders per 5 minutes per IP
const orderCreateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many orders placed. Please wait before placing another.' },
});

router.use(authenticate);
router.post('/', orderCreateLimiter, asyncHandler(placeOrder));
router.get('/', asyncHandler(getMyOrders));
router.get('/:id', asyncHandler(getOrderById));
router.patch('/:id/cancel', asyncHandler(cancelOrder));

export default router;
