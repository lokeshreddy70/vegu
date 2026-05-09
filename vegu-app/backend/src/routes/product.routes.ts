import { Router } from 'express';
import { getProducts, getProductBySlug, getFeaturedProducts, getTrendingProducts, getBazaarProducts, createReview } from '../controllers/product.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/bazaar', getBazaarProducts);
router.get('/:slug', getProductBySlug);
router.post('/:slug/reviews', authenticate, createReview);

export default router;
