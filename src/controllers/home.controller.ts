/**
 * Home Controller
 * Handles service information and version endpoints
 */

import { Request, Response } from 'express';

/**
 * Service information endpoint
 */
export const info = (_req: Request, res: Response): void => {
  res.json({
    message: 'Welcome to the Web BFF Service',
    service: 'web-bff',
    description: 'Backend for Frontend aggregation service for xshop.ai platform',
    environment: process.env.NODE_ENV || 'development',
  });
};

/**
 * Service version endpoint
 */
export const version = (_req: Request, res: Response): void => {
  res.json({
    service: 'web-bff',
    version: process.env.VERSION || '1.0.0',
  });
};
