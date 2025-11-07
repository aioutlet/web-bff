/**
 * Admin Dashboard Routes for Web BFF
 * Aggregates data from multiple services for admin dashboard
 */

import { Router, Request, Response } from 'express';
import logger from '../core/logger';
import { adminDashboardAggregator } from '../aggregators/admin.dashboard.aggregator';

const router = Router();

/**
 * Dashboard Stats Aggregation
 * Aggregates stats from multiple microservices via dedicated aggregator
 * Optionally includes recent orders and users
 */
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const includeRecent = req.query.includeRecent === 'true';
  const recentLimit = parseInt(req.query.recentLimit as string) || 10;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
    };

    // Get base stats
    const stats = await adminDashboardAggregator.getDashboardStats(correlationId, authHeaders);

    // Optionally add recent data if requested
    let response: any = { ...stats };

    if (includeRecent) {
      const [recentOrders, recentUsers] = await Promise.allSettled([
        adminDashboardAggregator.getRecentOrders(recentLimit, correlationId, authHeaders),
        adminDashboardAggregator.getRecentUsers(recentLimit, correlationId, authHeaders),
      ]);

      response.recentOrders = recentOrders.status === 'fulfilled' ? recentOrders.value : [];
      response.recentUsers = recentUsers.status === 'fulfilled' ? recentUsers.value : [];
    }

    res.json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error('Failed to fetch dashboard stats', { error, correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
});

/**
 * User Management Routes
 */

/**
 * GET /api/admin/users
 * Get all users with optional filtering and pagination
 */
router.get('/users', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { adminClient } = await import('../clients/admin.client');
    const users = await adminClient.getAllUsers(authHeaders);

    res.json({
      success: true,
      data: users,
    });
  } catch (error: any) {
    logger.error('Failed to fetch users', { error, correlationId });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch users',
    });
  }
});

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
router.get('/users/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { adminClient } = await import('../clients/admin.client');
    const user = await adminClient.getUserById(id, authHeaders);

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error('Failed to fetch user', { error, correlationId, userId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch user',
    });
  }
});

/**
 * POST /api/admin/users
 * Create a new user
 */
router.post('/users', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { adminClient } = await import('../clients/admin.client');
    const user = await adminClient.createUser(req.body, authHeaders);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error('Failed to create user', { error, correlationId });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to create user',
    });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Update user
 */
router.patch('/users/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { adminClient } = await import('../clients/admin.client');
    const user = await adminClient.updateUser(id, req.body, authHeaders);

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    logger.error('Failed to update user', { error, correlationId, userId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to update user',
    });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { adminClient } = await import('../clients/admin.client');
    await adminClient.deleteUser(id, authHeaders);

    res.status(204).send();
  } catch (error: any) {
    logger.error('Failed to delete user', { error, correlationId, userId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to delete user',
    });
  }
});

/**
 * Product Management Routes
 */

/**
 * GET /api/admin/products
 * Get all products with optional filtering and pagination
 */
router.get('/products', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { productClient } = await import('../clients/product.client');
    const products = await productClient.getAllProducts(authHeaders, req.query);

    res.json({
      success: true,
      data: products.products || [],
      pagination: {
        page: 1,
        limit: req.query.limit || 20,
        total: products.total_count || 0,
        totalPages: Math.ceil((products.total_count || 0) / (Number(req.query.limit) || 20)),
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch products', { error, correlationId });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch products',
    });
  }
});

/**
 * GET /api/admin/products/:id
 * Get product by ID
 */
router.get('/products/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { productClient } = await import('../clients/product.client');
    const product = await productClient.getProductById(id, authHeaders);

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    logger.error('Failed to fetch product', { error, correlationId, productId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch product',
    });
  }
});

/**
 * POST /api/admin/products
 * Create new product
 */
router.post('/products', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { productClient } = await import('../clients/product.client');
    const product = await productClient.createProduct(req.body, authHeaders);

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    logger.error('Failed to create product', { error, correlationId });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to create product',
    });
  }
});

/**
 * PATCH /api/admin/products/:id
 * Update product
 */
router.patch('/products/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { productClient } = await import('../clients/product.client');
    const product = await productClient.updateProduct(id, req.body, authHeaders);

    res.json({
      success: true,
      data: product,
    });
  } catch (error: any) {
    logger.error('Failed to update product', { error, correlationId, productId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to update product',
    });
  }
});

/**
 * DELETE /api/admin/products/:id
 * Delete product
 */
router.delete('/products/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { productClient } = await import('../clients/product.client');
    await productClient.deleteProduct(id, authHeaders);

    res.status(204).send();
  } catch (error: any) {
    logger.error('Failed to delete product', { error, correlationId, productId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to delete product',
    });
  }
});

/**
 * Review Management Routes
 */

/**
 * GET /api/admin/reviews
 * Get all reviews with optional filtering
 */
router.get('/reviews', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { reviewClient } = await import('../clients/review.client');
    const reviews = await reviewClient.getAllReviews(authHeaders, req.query);

    res.json({
      success: true,
      data: reviews.data || [],
      pagination: reviews.pagination || {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch reviews', { error, correlationId });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch reviews',
    });
  }
});

/**
 * GET /api/admin/reviews/stats
 * Get review statistics for admin dashboard
 */
router.get('/reviews/stats', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { reviewClient } = await import('../clients/review.client');
    const stats = await reviewClient.getDashboardStats(authHeaders);

    res.json({
      success: true,
      data: stats.data || stats,
    });
  } catch (error: any) {
    logger.error('Failed to fetch review stats', { error, correlationId });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch review stats',
    });
  }
});

/**
 * GET /api/admin/reviews/:id
 * Get review by ID
 */
router.get('/reviews/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { reviewClient } = await import('../clients/review.client');
    const review = await reviewClient.getReviewById(id, authHeaders);

    res.json({
      success: true,
      data: review.data || review,
    });
  } catch (error: any) {
    logger.error('Failed to fetch review', { error, correlationId, reviewId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch review',
    });
  }
});

/**
 * PATCH /api/admin/reviews/:id
 * Update review (approve/reject/moderate)
 */
router.patch('/reviews/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { reviewClient } = await import('../clients/review.client');
    const review = await reviewClient.updateReview(id, req.body, authHeaders);

    res.json({
      success: true,
      data: review.data || review,
    });
  } catch (error: any) {
    logger.error('Failed to update review', { error, correlationId, reviewId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to update review',
    });
  }
});

/**
 * DELETE /api/admin/reviews/:id
 * Delete review
 */
router.delete('/reviews/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { reviewClient } = await import('../clients/review.client');
    await reviewClient.deleteReview(id, authHeaders);

    res.status(204).send();
  } catch (error: any) {
    logger.error('Failed to delete review', { error, correlationId, reviewId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to delete review',
    });
  }
});

/**
 * POST /api/admin/reviews/bulk-delete
 * Bulk delete reviews
 */
router.post('/reviews/bulk-delete', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { reviewClient } = await import('../clients/review.client');
    const result = await reviewClient.bulkDeleteReviews(req.body.reviewIds, authHeaders);

    res.json({
      success: true,
      data: result.data || result,
    });
  } catch (error: any) {
    logger.error('Failed to bulk delete reviews', { error, correlationId });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to bulk delete reviews',
    });
  }
});

/**
 * Order Management Routes
 */

/**
 * GET /api/admin/orders
 * Get all orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { orderClient } = await import('../clients/order.client');
    const orders = await orderClient.getAllOrders(authHeaders);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    logger.error('Failed to fetch orders', {
      error: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      correlationId,
    });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || error.response?.data || 'Failed to fetch orders',
    });
  }
});

/**
 * GET /api/admin/orders/paged
 * Get orders with pagination
 */
router.get('/orders/paged', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { orderClient } = await import('../clients/order.client');
    const orders = await orderClient.getOrdersPaged(authHeaders, req.query);

    res.json({
      success: true,
      data: orders.items || [],
      pagination: {
        page: orders.page || 1,
        pageSize: orders.pageSize || 20,
        total: orders.totalItems || 0,
        totalPages: orders.totalPages || 0,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch paged orders', {
      errorMessage: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
      correlationId,
    });
    res.status(error.response?.status || 500).json({
      success: false,
      error:
        error.response?.data?.message ||
        error.response?.data ||
        error.message ||
        'Failed to fetch orders',
    });
  }
});

/**
 * GET /api/admin/orders/:id
 * Get order by ID
 */
router.get('/orders/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { orderClient } = await import('../clients/order.client');
    const order = await orderClient.getOrderById(id, authHeaders);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('Failed to fetch order', { error, correlationId, orderId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to fetch order',
    });
  }
});

/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
router.put('/orders/:id/status', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { orderClient } = await import('../clients/order.client');
    const order = await orderClient.updateOrderStatus(id, req.body, authHeaders);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('Failed to update order status', { error, correlationId, orderId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to update order status',
    });
  }
});

/**
 * DELETE /api/admin/orders/:id
 * Delete order
 */
router.delete('/orders/:id', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const { id } = req.params;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
      'x-correlation-id': correlationId,
    };

    const { orderClient } = await import('../clients/order.client');
    await orderClient.deleteOrder(id, authHeaders);

    res.status(204).send();
  } catch (error: any) {
    logger.error('Failed to delete order', { error, correlationId, orderId: id });
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.message || 'Failed to delete order',
    });
  }
});

export default router;
