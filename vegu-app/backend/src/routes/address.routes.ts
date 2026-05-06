import { Router } from 'express';
import { getAddresses, createAddress, updateAddress, deleteAddress } from '../controllers/address.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);
router.get('/', getAddresses);
router.post('/', createAddress);
router.patch('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;
