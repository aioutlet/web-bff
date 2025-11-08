/**
 * Admin Dashboard Routes for Web BFF
 * Route definitions only - all logic is in admin.controller.ts
 */

import { Router } from 'express';
import * as adminController from '@controllers/admin.controller';

const router = Router();

// Dashboard Routes
router.get('/dashboard/stats', adminController.getDashboardStats);

// User Management Routes
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.post('/users', adminController.createUser);
router.patch('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

// Product Management Routes
router.get('/products', adminController.getAllProducts);
router.get('/products/:id', adminController.getProductById);
router.post('/products', adminController.createProduct);
router.patch('/products/:id', adminController.updateProduct);
router.delete('/products/:id', adminController.deleteProduct);

// Review Management Routes
router.get('/reviews', adminController.getAllReviews);
router.get('/reviews/stats', adminController.getReviewStats);
router.get('/reviews/:id', adminController.getReviewById);
router.patch('/reviews/:id', adminController.updateReview);
router.delete('/reviews/:id', adminController.deleteReview);
router.post('/reviews/bulk-delete', adminController.bulkDeleteReviews);

// Order Management Routes
router.get('/orders', adminController.getAllOrders);
router.get('/orders/paged', adminController.getOrdersPaged);
router.get('/orders/:id', adminController.getOrderById);
router.put('/orders/:id/status', adminController.updateOrderStatus);
router.delete('/orders/:id', adminController.deleteOrder);

export default router;
