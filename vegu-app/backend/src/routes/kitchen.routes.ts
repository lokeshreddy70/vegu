import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { kitchenChat } from '../controllers/kitchen.controller';
import { rateLimit } from 'express-rate-limit';

const router = Router();

// 20 AI requests per 10 minutes per user
const kitchenLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests to AI kitchen, please wait.' },
});

router.post('/chat', kitchenLimiter, authenticate, kitchenChat);

export default router;
