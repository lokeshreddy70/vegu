import { Router } from 'express';
import { getDashboard, getUsersSummary, broadcastNotification } from '../controllers/admin/dashboard.controller';
import { getUsers, getUserDetail, toggleUserStatus } from '../controllers/admin/users.controller';
import { getVendors, updateVendorStatus } from '../controllers/admin/vendors.controller';
import { getProducts, createProduct, updateProduct, deleteProduct, toggleProductFeatured, toggleProductAvailability } from '../controllers/admin/products.controller';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/admin/categories.controller';
import { getOrders, getOrderDetail, updateOrderStatus } from '../controllers/admin/orders.controller';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/admin/banners.controller';
import { getCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/admin/coupons.controller';
import { getAnalytics } from '../controllers/admin/analytics.controller';
import { getInventory, updateStock } from '../controllers/admin/inventory.controller';
import { getSettings, updateSettings, getLogs } from '../controllers/admin/settings.controller';
import { getSupportOverview, getSupportTickets, getSupportTicketDetail, updateSupportTicket, replyToSupportTicket } from '../controllers/admin/support.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();
router.use(authenticate, requireRole('ADMIN'));

// Dashboard & Analytics
router.get('/dashboard', asyncHandler(getDashboard));
router.get('/analytics', asyncHandler(getAnalytics));

// Users
router.get('/users/summary', asyncHandler(getUsersSummary));
router.get('/users', asyncHandler(getUsers));
router.get('/users/:id', asyncHandler(getUserDetail));
router.patch('/users/:id/toggle', asyncHandler(toggleUserStatus));

// Vendors
router.get('/vendors', asyncHandler(getVendors));
router.patch('/vendors/:id/status', asyncHandler(updateVendorStatus));

// Products
router.get('/products', asyncHandler(getProducts));
router.post('/products', asyncHandler(createProduct));
router.patch('/products/:id', asyncHandler(updateProduct));
router.delete('/products/:id', asyncHandler(deleteProduct));
router.patch('/products/:id/availability', asyncHandler(toggleProductAvailability));
router.patch('/products/:id/featured', asyncHandler(toggleProductFeatured));

// Categories
router.get('/categories', asyncHandler(getCategories));
router.post('/categories', asyncHandler(createCategory));
router.patch('/categories/:id', asyncHandler(updateCategory));
router.delete('/categories/:id', asyncHandler(deleteCategory));

// Orders
router.get('/orders', asyncHandler(getOrders));
router.get('/orders/:id', asyncHandler(getOrderDetail));
router.patch('/orders/:id/status', asyncHandler(updateOrderStatus));

// Inventory
router.get('/inventory', asyncHandler(getInventory));
router.patch('/inventory/:id/stock', asyncHandler(updateStock));

// Banners
router.get('/banners', asyncHandler(getBanners));
router.post('/banners', asyncHandler(createBanner));
router.patch('/banners/:id', asyncHandler(updateBanner));
router.delete('/banners/:id', asyncHandler(deleteBanner));

// Coupons
router.get('/coupons', asyncHandler(getCoupons));
router.post('/coupons', asyncHandler(createCoupon));
router.patch('/coupons/:id', asyncHandler(updateCoupon));
router.delete('/coupons/:id', asyncHandler(deleteCoupon));

// Settings
router.get('/settings', asyncHandler(getSettings));
router.patch('/settings', asyncHandler(updateSettings));

// Audit Logs
router.get('/logs', asyncHandler(getLogs));

// Notifications
router.post('/notifications/broadcast', asyncHandler(broadcastNotification));

// Support operations
router.get('/support/overview', asyncHandler(getSupportOverview));
router.get('/support/tickets', asyncHandler(getSupportTickets));
router.get('/support/tickets/:id', asyncHandler(getSupportTicketDetail));
router.patch('/support/tickets/:id', asyncHandler(updateSupportTicket));
router.post('/support/tickets/:id/reply', asyncHandler(replyToSupportTicket));

export default router;
