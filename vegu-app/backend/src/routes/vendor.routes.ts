import { Router } from 'express';
import {
  getMyVendorProfile, updateVendorProfile, getVendorProducts, createProduct,
  updateProduct, getVendorOrders, updateOrderStatus, getVendorDashboard,
  applyAsVendor,
} from '../controllers/vendor.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Public vendor registration (authenticated customer applies to become a vendor)
router.post('/apply', authenticate, applyAsVendor);

// Vendor-only routes
router.use(authenticate, requireRole('VENDOR'));
router.get('/dashboard', getVendorDashboard);
router.get('/profile', getMyVendorProfile);
router.patch('/profile', updateVendorProfile);
router.get('/products', getVendorProducts);
router.post('/products', createProduct);
router.patch('/products/:id', updateProduct);
router.get('/orders', getVendorOrders);
router.patch('/orders/:id/status', updateOrderStatus);

export default router;
