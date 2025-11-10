/**
 * Cart Routes for Web BFF
 * Route definitions only - all logic is in cart.controller.ts
 */

import { Router, RequestHandler } from 'express';
import * as cartController from '@controllers/cart.controller';

const router = Router();

// Authenticated Cart Routes
router.get('/', cartController.getCart as unknown as RequestHandler);
router.post('/items', cartController.addItem as unknown as RequestHandler);
router.put('/items/:productId', cartController.updateItem as unknown as RequestHandler);
router.delete('/items/:productId', cartController.removeItem as unknown as RequestHandler);
router.delete('/', cartController.clearCart as unknown as RequestHandler);
router.post('/transfer', cartController.transferCart as unknown as RequestHandler);

// Guest Cart Routes
router.get('/guest/:guestId', cartController.getGuestCart as unknown as RequestHandler);
router.post('/guest/:guestId/items', cartController.addGuestItem as unknown as RequestHandler);
router.put('/guest/:guestId/items/:productId', cartController.updateGuestItem as unknown as RequestHandler);
router.delete('/guest/:guestId/items/:productId', cartController.removeGuestItem as unknown as RequestHandler);
router.delete('/guest/:guestId', cartController.clearGuestCart as unknown as RequestHandler);

export default router;
