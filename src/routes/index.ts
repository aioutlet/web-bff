import { Router } from 'express';
import homeRoutes from './home.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import healthRoutes from './health.routes';
import productsRoutes from './products.routes';
import adminRoutes from './admin.routes';
import orderRoutes from './order.routes';

const router = Router();

// Mount routes
router.use('/home', homeRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/products', productsRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);

// Health check routes (no /api prefix)
router.use('/health', healthRoutes);

export default router;
