import { Router } from 'express';
import { placeOrder, getMyOrders, getOrderById, cancelOrder } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);
router.post('/', asyncHandler(placeOrder));
router.get('/', asyncHandler(getMyOrders));
router.get('/:id', asyncHandler(getOrderById));
router.patch('/:id/cancel', asyncHandler(cancelOrder));

export default router;
