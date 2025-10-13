import { Router } from 'express';
import homeRoutes from './home.routes';
import healthRoutes from './health.routes';

const router = Router();

// Mount routes
router.use('/home', homeRoutes);

// Health check routes (no /api prefix)
router.use('/health', healthRoutes);

export default router;
