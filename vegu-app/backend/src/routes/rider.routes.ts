import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  getRiderDashboard,
  getMyOrders,
  getAvailableOrders,
  acceptOrder,
  updateOrderStatus,
  submitProof,
  updateLocation,
  toggleStatus,
  registerAsRider,
} from '../controllers/rider.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', authenticate, asyncHandler(registerAsRider));

router.use(authenticate, requireRole('DELIVERY'));
router.get('/dashboard', asyncHandler(getRiderDashboard));
router.get('/orders', asyncHandler(getMyOrders));
router.get('/orders/available', asyncHandler(getAvailableOrders));
router.post('/orders/:id/accept', asyncHandler(acceptOrder));
router.patch('/orders/:id/status', asyncHandler(updateOrderStatus));
router.post('/orders/:id/proof', asyncHandler(submitProof));
router.patch('/location', asyncHandler(updateLocation));
router.patch('/toggle-status', asyncHandler(toggleStatus));

export default router;
