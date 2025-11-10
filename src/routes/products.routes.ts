/**
 * Products Routes for Web BFF
 * Route definitions only - all logic is in products.controller.ts
 * Uses optional authentication to provide personalized features when logged in
 */

import { Router, RequestHandler } from 'express';
import * as productsController from '@controllers/products.controller';
import { optionalAuth } from '@middleware/auth.middleware';

const router = Router();

// Apply optional authentication to all product routes
router.use(optionalAuth as any);

// Product Routes
router.get('/', productsController.getProducts as unknown as RequestHandler);
router.get('/search', productsController.searchProducts as unknown as RequestHandler);
router.get('/:id', productsController.getProductById as unknown as RequestHandler);
router.get('/:id/reviews', productsController.getProductReviewsById as unknown as RequestHandler);

export default router;
