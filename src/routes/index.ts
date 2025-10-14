import { Router } from 'express';
import homeRoutes from './home.routes';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount routes
router.use('/home', homeRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);

// Health check routes (no /api prefix)
router.use('/health', healthRoutes);

export default router;
