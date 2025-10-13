import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /health
 * Basic health check
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'web-bff',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /health/ready
 * Readiness check (can check dependencies here)
 */
router.get('/ready', async (_req: Request, res: Response) => {
  // TODO: Add checks for Redis, backend services, etc.
  res.json({
    success: true,
    service: 'web-bff',
    status: 'ready',
    timestamp: new Date().toISOString(),
  });
});

export default router;
