/**
 * Storefront Routes for Web BFF
 * Route definitions for storefront/homepage endpoints
 */

import { Router, RequestHandler } from 'express';
import * as storefrontController from '@controllers/storefront.controller';
import { optionalAuth } from '@middleware/auth.middleware';

const router = Router();

// Storefront Home Routes - with optional auth for personalization
// Combined endpoint - fetch both trending products and categories in one request
router.get(
  '/home',
  optionalAuth as any,
  storefrontController.getHomeData as unknown as RequestHandler
);

// Individual endpoints (kept for backward compatibility)
router.get(
  '/trending-products',
  optionalAuth as any,
  storefrontController.getTrendingProducts as unknown as RequestHandler
);
router.get(
  '/trending-categories',
  optionalAuth as any,
  storefrontController.getTrendingCategories as unknown as RequestHandler
);
router.get(
  '/categories',
  optionalAuth as any,
  storefrontController.getCategories as unknown as RequestHandler
);

export default router;
