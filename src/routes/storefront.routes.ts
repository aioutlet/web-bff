/**
 * Storefront Routes for Web BFF
 * Route definitions for storefront/homepage endpoints
 */

import { Router, RequestHandler } from 'express';
import * as storefrontController from '@controllers/storefront.controller';
import { optionalAuth } from '@middleware/auth.middleware';

const router = Router();

// Storefront Home Routes - with optional auth for personalization
router.get(
  '/home',
  optionalAuth as any,
  storefrontController.getTrendingData as unknown as RequestHandler
);

router.get(
  '/categories',
  optionalAuth as any,
  storefrontController.getCategories as unknown as RequestHandler
);

export default router;
