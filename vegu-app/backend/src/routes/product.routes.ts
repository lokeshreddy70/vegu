import { Router } from 'express';
import { getProducts, getProductBySlug, getFeaturedProducts, getTrendingProducts, getBazaarProducts, createReview } from '../controllers/product.controller';
import { getPriceSignals } from '../controllers/price-signals.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getProducts));
router.get('/featured', asyncHandler(getFeaturedProducts));
router.get('/trending', asyncHandler(getTrendingProducts));
router.get('/bazaar', asyncHandler(getBazaarProducts));
router.get('/price-signals', asyncHandler(getPriceSignals));
router.get('/:slug', asyncHandler(getProductBySlug));
router.post('/:slug/reviews', authenticate, asyncHandler(createReview));

export default router;
