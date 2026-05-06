import { Router } from 'express';
import { placeOrder, getMyOrders, getOrderById, cancelOrder } from '../controllers/order.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.post('/', placeOrder);
router.get('/', getMyOrders);
router.get('/:id', getOrderById);
router.patch('/:id/cancel', cancelOrder);

export default router;
