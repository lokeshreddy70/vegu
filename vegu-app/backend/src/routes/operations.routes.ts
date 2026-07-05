import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';
import { OPS_ROLES } from '../utils/ops-roles';
import { operationsLogin, operationsForgotPassword, operationsResetPassword, operationsMe } from '../controllers/operations/auth.controller';
import { getOperationsDashboard } from '../controllers/operations/dashboard.controller';
import { getOperationsOrders, updateOperationsOrderStage } from '../controllers/operations/orders.controller';
import { getOperationsInventory, updateOperationsInventoryStock } from '../controllers/operations/inventory.controller';
import { getOperationsStores, getOperationsRiders, getOperationsVendors, getOperationsSupportTickets } from '../controllers/operations/meta.controller';

const router = Router();

router.post('/auth/login', asyncHandler(operationsLogin));
router.post('/auth/forgot-password', asyncHandler(operationsForgotPassword));
router.post('/auth/reset-password', asyncHandler(operationsResetPassword));

router.use(authenticate, requireRole(...OPS_ROLES));

router.get('/auth/me', asyncHandler(operationsMe));
router.get('/dashboard', asyncHandler(getOperationsDashboard));
router.get('/orders', asyncHandler(getOperationsOrders));
router.patch('/orders/:id/stage', asyncHandler(updateOperationsOrderStage));
router.get('/inventory', asyncHandler(getOperationsInventory));
router.patch('/inventory/:id/stock', asyncHandler(updateOperationsInventoryStock));
router.get('/stores', asyncHandler(getOperationsStores));
router.get('/riders', asyncHandler(getOperationsRiders));
router.get('/vendors', asyncHandler(getOperationsVendors));
router.get('/support/tickets', asyncHandler(getOperationsSupportTickets));

export default router;
