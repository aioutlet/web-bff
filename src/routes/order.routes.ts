/**
 * Order Routes for Web BFF
 * Route definitions only - all logic is in order.controller.ts
 */

import { Router, RequestHandler } from 'express';
import * as orderController from '@controllers/order.controller';

const router = Router();

// Order Routes
router.post('/', orderController.createOrder as unknown as RequestHandler);
router.get('/my', orderController.getMyOrders as unknown as RequestHandler);
router.get('/my/paged', orderController.getMyOrdersPaged as unknown as RequestHandler);
router.get('/:id', orderController.getOrderById as unknown as RequestHandler);

export default router;
