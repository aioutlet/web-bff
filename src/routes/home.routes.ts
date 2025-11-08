/**
 * Home Routes for Web BFF
 * Route definitions only - all logic is in home.controller.ts
 */

import { Router } from 'express';
import * as homeController from '@controllers/home.controller';

const router = Router();

// Service Information Routes
router.get('/', homeController.info);
router.get('/version', homeController.version);

// Storefront Home Routes
router.get('/trending', homeController.getTrendingProducts);
router.get('/trending-categories', homeController.getTrendingCategories);
router.get('/categories', homeController.getCategories);

export default router;
