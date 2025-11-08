/**
 * Cart Routes for Web BFF
 * Route definitions only - all logic is in cart.controller.ts
 */

import { Router } from 'express';
import * as cartController from '@controllers/cart.controller';

const router = Router();

// Authenticated Cart Routes
router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:productId', cartController.updateItem);
router.delete('/items/:productId', cartController.removeItem);
router.delete('/', cartController.clearCart);
router.post('/transfer', cartController.transferCart);

// Guest Cart Routes
router.get('/guest/:guestId', cartController.getGuestCart);
router.post('/guest/:guestId/items', cartController.addGuestItem);
router.put('/guest/:guestId/items/:productId', cartController.updateGuestItem);
router.delete('/guest/:guestId/items/:productId', cartController.removeGuestItem);
router.delete('/guest/:guestId', cartController.clearGuestCart);

export default router;
