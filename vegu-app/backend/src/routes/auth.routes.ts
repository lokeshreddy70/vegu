import { Router } from 'express';
import { register, login, refreshTokens, logout, getMe, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshTokens);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, updateProfile);

export default router;
