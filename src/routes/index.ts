import { Router } from 'express';
import storefrontRoutes from './storefront.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import productsRoutes from './products.routes';
import adminRoutes from './admin.routes';
import orderRoutes from './order.routes';
import cartRoutes from './cart.routes';
import inventoryRoutes from './inventory.routes';

const router = Router();

// Mount routes
router.use('/storefront', storefrontRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/products', productsRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/admin', adminRoutes);
router.use('/inventory', inventoryRoutes);

export default router;
