import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { chat, createTicket, getMyTickets, getTicketDetail, replyToTicket } from '../controllers/support.controller';

const router = Router();

router.post('/chat', optionalAuth, asyncHandler(chat));
router.post('/tickets', authenticate, asyncHandler(createTicket));
router.get('/tickets/me', authenticate, asyncHandler(getMyTickets));
router.get('/tickets/:id', authenticate, asyncHandler(getTicketDetail));
router.post('/tickets/:id/reply', authenticate, asyncHandler(replyToTicket));

export default router;
