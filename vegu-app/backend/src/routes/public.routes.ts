import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { getPublicAppConfig, getPublicPage } from '../controllers/public.controller';

const router = Router();

router.get('/config', asyncHandler(getPublicAppConfig));
router.get('/pages/:slug', asyncHandler(getPublicPage));

export default router;