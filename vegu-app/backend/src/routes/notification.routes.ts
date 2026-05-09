import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead, getUnreadCount } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(getNotifications));
router.get('/unread-count', asyncHandler(getUnreadCount));
router.patch('/read-all', asyncHandler(markAllRead));
router.patch('/:id/read', asyncHandler(markAsRead));

export default router;
