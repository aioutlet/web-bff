/**
 * Products Routes for Web BFF
 * Route definitions only - all logic is in products.controller.ts
 */

import { Router } from 'express';
import * as productsController from '@controllers/products.controller';

const router = Router();

// Product Routes
router.get('/', productsController.getProducts);
router.get('/search', productsController.searchProducts);
router.get('/:id', productsController.getProductById);
router.get('/:id/reviews', productsController.getProductReviewsById);

export default router;
