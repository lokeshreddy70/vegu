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

const router = Router();

// Any authenticated user can register as rider
router.post('/register', authenticate, registerAsRider);

// All routes below require DELIVERY role
router.use(authenticate, requireRole('DELIVERY'));

router.get('/dashboard', getRiderDashboard);
router.get('/orders', getMyOrders);
router.get('/orders/available', getAvailableOrders);
router.post('/orders/:id/accept', acceptOrder);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/proof', submitProof);
router.patch('/location', updateLocation);
router.patch('/toggle-status', toggleStatus);

export default router;
