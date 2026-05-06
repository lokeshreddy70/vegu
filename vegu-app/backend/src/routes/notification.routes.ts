import { Router } from 'express';
import { getNotifications, markAsRead, markAllRead, getUnreadCount } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markAsRead);

export default router;
