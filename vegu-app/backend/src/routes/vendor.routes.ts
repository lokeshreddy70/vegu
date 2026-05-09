import { Router } from 'express';
import {
  getMyVendorProfile, updateVendorProfile, getVendorProducts, createProduct,
  updateProduct, getVendorOrders, updateOrderStatus, getVendorDashboard,
  applyAsVendor,
} from '../controllers/vendor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/apply', authenticate, asyncHandler(applyAsVendor));

router.use(authenticate, requireRole('VENDOR'));
router.get('/dashboard', asyncHandler(getVendorDashboard));
router.get('/profile', asyncHandler(getMyVendorProfile));
router.patch('/profile', asyncHandler(updateVendorProfile));
router.get('/products', asyncHandler(getVendorProducts));
router.post('/products', asyncHandler(createProduct));
router.patch('/products/:id', asyncHandler(updateProduct));
router.get('/orders', asyncHandler(getVendorOrders));
router.patch('/orders/:id/status', asyncHandler(updateOrderStatus));

export default router;
