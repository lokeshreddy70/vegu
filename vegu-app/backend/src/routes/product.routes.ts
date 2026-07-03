import { Router } from 'express';
import { getProducts, getProductBySlug, getFeaturedProducts, getTrendingProducts, getBazaarProducts, streamBazaarProducts, createReview } from '../controllers/product.controller';
import { getPriceSignals, streamPriceSignals } from '../controllers/price-signals.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(getProducts));
router.get('/featured', asyncHandler(getFeaturedProducts));
router.get('/trending', asyncHandler(getTrendingProducts));
router.get('/bazaar', asyncHandler(getBazaarProducts));
router.get('/bazaar/stream', asyncHandler(streamBazaarProducts));
router.get('/price-signals', asyncHandler(getPriceSignals));
router.get('/price-signals/stream', asyncHandler(streamPriceSignals));
router.get('/:slug', asyncHandler(getProductBySlug));
router.post('/:slug/reviews', authenticate, asyncHandler(createReview));

export default router;
