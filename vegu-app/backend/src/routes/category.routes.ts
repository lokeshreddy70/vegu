import { Router } from 'express';
import { getCategories, getCategoryBySlug } from '../controllers/category.controller';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getCategories));
router.get('/:slug', asyncHandler(getCategoryBySlug));

export default router;
