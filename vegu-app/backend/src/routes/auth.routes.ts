import { Router } from 'express';
import { register, login, refreshTokens, logout, logoutAll, getSessions, getMe, updateProfile, deleteMyAccount } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.post('/refresh', asyncHandler(refreshTokens));
router.post('/logout', asyncHandler(logout));
router.post('/logout-all', authenticate, asyncHandler(logoutAll));
router.get('/sessions', authenticate, asyncHandler(getSessions));
router.get('/me', authenticate, asyncHandler(getMe));
router.patch('/me', authenticate, asyncHandler(updateProfile));
router.delete('/me', authenticate, asyncHandler(deleteMyAccount));

export default router;
