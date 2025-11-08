/**
 * Order Routes for Web BFF
 * Route definitions only - all logic is in order.controller.ts
 */

import { Router } from 'express';
import * as orderController from '@controllers/order.controller';

const router = Router();

// Order Routes
router.post('/', orderController.createOrder);
router.get('/my', orderController.getMyOrders);
router.get('/my/paged', orderController.getMyOrdersPaged);
router.get('/:id', orderController.getOrderById);

export default router;
