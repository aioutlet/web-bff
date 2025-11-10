/**
 * Home Routes for Web BFF
 * Route definitions only - all logic is in home.controller.ts
 */

import { Router, RequestHandler } from 'express';
import * as homeController from '@controllers/home.controller';

const router = Router();

// Service Information Routes
router.get('/', homeController.info as unknown as RequestHandler);
router.get('/version', homeController.version as unknown as RequestHandler);

// Storefront Home Routes
router.get('/trending', homeController.getTrendingProducts as unknown as RequestHandler);
router.get('/trending-categories', homeController.getTrendingCategories as unknown as RequestHandler);
router.get('/categories', homeController.getCategories as unknown as RequestHandler);

export default router;
