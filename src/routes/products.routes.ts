/**
 * Products Routes for Web BFF
 * Route definitions only - all logic is in products.controller.ts
 */

import { Router, RequestHandler } from 'express';
import * as productsController from '@controllers/products.controller';

const router = Router();

// Product Routes
router.get('/', productsController.getProducts as unknown as RequestHandler);
router.get('/search', productsController.searchProducts as unknown as RequestHandler);
router.get('/:id', productsController.getProductById as unknown as RequestHandler);
router.get('/:id/reviews', productsController.getProductReviewsById as unknown as RequestHandler);

export default router;
