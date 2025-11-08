/**
 * Operational/Infrastructure endpoints
 * These endpoints are used by monitoring systems, load balancers, and DevOps tools
 */

import { Request, Response } from 'express';

/**
 * Basic health check endpoint
 */
export const health = (_req: Request, res: Response): void => {
  res.json({
    status: 'healthy',
    service: 'web-bff',
    timestamp: new Date().toISOString(),
    version: process.env.VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
};

/**
 * Readiness probe - checks if service is ready to receive traffic
 */
export const readiness = async (_req: Request, res: Response): Promise<void> => {
  // TODO: Add checks for Redis, backend services, etc.
  res.json({
    status: 'ready',
    service: 'web-bff',
    timestamp: new Date().toISOString(),
  });
};

/**
 * Liveness probe - checks if service is alive (not deadlocked)
 */
export const liveness = async (_req: Request, res: Response): Promise<void> => {
  res.json({
    status: 'alive',
    service: 'web-bff',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

/**
 * Metrics endpoint - system metrics for monitoring
 */
export const metrics = (_req: Request, res: Response): void => {
  const memoryUsage = process.memoryUsage();
  res.json({
    service: 'web-bff',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
    },
    nodeVersion: process.version,
    platform: process.platform,
  });
};
