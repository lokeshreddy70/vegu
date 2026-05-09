import { Router } from 'express';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/address.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);
router.get('/', asyncHandler(getAddresses));
router.post('/', asyncHandler(createAddress));
router.patch('/:id', asyncHandler(updateAddress));
router.delete('/:id', asyncHandler(deleteAddress));

export default router;
