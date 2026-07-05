import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { getMyWallet } from '../controllers/wallet.controller';

const router = Router();

router.use(authenticate);
router.get('/me', asyncHandler(getMyWallet));

export default router;
