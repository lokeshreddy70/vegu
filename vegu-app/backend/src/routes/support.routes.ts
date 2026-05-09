import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { chat } from '../controllers/support.controller';

const router = Router();

router.post('/chat', asyncHandler(chat));

export default router;
