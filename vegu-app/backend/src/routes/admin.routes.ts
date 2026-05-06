import { Router } from 'express';
import { getDashboard, getUsers, toggleUserStatus, getVendors, updateVendorStatus, getOrders, getBanners, createBanner, deleteBanner } from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));
router.get('/dashboard', getDashboard);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUserStatus);
router.get('/vendors', getVendors);
router.patch('/vendors/:id/status', updateVendorStatus);
router.get('/orders', getOrders);
router.get('/banners', getBanners);
router.post('/banners', createBanner);
router.delete('/banners/:id', deleteBanner);

export default router;
