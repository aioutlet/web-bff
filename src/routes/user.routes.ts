/**
 * User Routes for Web BFF
 * Route definitions only - all logic is in user.controller.ts
 */

import { Router } from 'express';
import * as userController from '@controllers/user.controller';

const router = Router();

// Profile Routes
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteAccount);

// Address Routes
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.createAddress);
router.patch('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);
router.patch('/addresses/:id/default', userController.setDefaultAddress);

// Payment Method Routes
router.get('/payment-methods', userController.getPaymentMethods);
router.post('/payment-methods', userController.createPaymentMethod);
router.patch('/payment-methods/:id', userController.updatePaymentMethod);
router.delete('/payment-methods/:id', userController.deletePaymentMethod);
router.patch('/payment-methods/:id/default', userController.setDefaultPaymentMethod);

// Wishlist Routes
router.get('/wishlist', userController.getWishlist);
router.post('/wishlist', userController.addToWishlist);
router.delete('/wishlist/:id', userController.removeFromWishlist);

export default router;
