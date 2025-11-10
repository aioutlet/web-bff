/**
 * User Routes for Web BFF
 * Route definitions only - all logic is in user.controller.ts
 * All routes require authentication
 */

import { Router, RequestHandler } from 'express';
import * as userController from '@controllers/user.controller';
import { requireAuth } from '@middleware/auth.middleware';

const router = Router();

// Apply authentication to all user routes
router.use(requireAuth as any);

// Profile Routes
router.get('/profile', userController.getProfile as unknown as RequestHandler);
router.patch('/profile', userController.updateProfile as unknown as RequestHandler);
router.delete('/profile', userController.deleteAccount as unknown as RequestHandler);

// Address Routes
router.get('/addresses', userController.getAddresses as unknown as RequestHandler);
router.post('/addresses', userController.createAddress as unknown as RequestHandler);
router.patch('/addresses/:id', userController.updateAddress as unknown as RequestHandler);
router.delete('/addresses/:id', userController.deleteAddress as unknown as RequestHandler);
router.patch(
  '/addresses/:id/default',
  userController.setDefaultAddress as unknown as RequestHandler
);

// Payment Method Routes
router.get('/payment-methods', userController.getPaymentMethods as unknown as RequestHandler);
router.post('/payment-methods', userController.createPaymentMethod as unknown as RequestHandler);
router.patch(
  '/payment-methods/:id',
  userController.updatePaymentMethod as unknown as RequestHandler
);
router.delete(
  '/payment-methods/:id',
  userController.deletePaymentMethod as unknown as RequestHandler
);
router.patch(
  '/payment-methods/:id/default',
  userController.setDefaultPaymentMethod as unknown as RequestHandler
);

// Wishlist Routes
router.get('/wishlist', userController.getWishlist as unknown as RequestHandler);
router.post('/wishlist', userController.addToWishlist as unknown as RequestHandler);
router.delete('/wishlist/:id', userController.removeFromWishlist as unknown as RequestHandler);

export default router;
