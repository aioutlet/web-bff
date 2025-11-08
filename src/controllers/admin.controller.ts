/**
 * Admin Controller for Web BFF
 * Handles all admin-related operations including dashboard, user, product, review, and order management
 */

import { Request, Response } from 'express';
import logger from '../core/logger';
import { adminDashboardAggregator } from '../aggregators/admin.dashboard.aggregator';

// ============================================================================
// Dashboard Controllers
// ============================================================================

/**
 * Dashboard Stats Aggregation
 * Aggregates stats from multiple microservices via dedicated aggregator
 * Optionally includes recent orders and users
 */
export const getDashboardStats = async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const includeRecent = req.query.includeRecent === 'true';
  const recentLimit = parseInt(req.query.recentLimit as string) || 10;

  logger.info('[BFF] Dashboard stats endpoint called', {
    correlationId,
    includeRecent,
    recentLimit,
    timestamp: new Date().toISOString(),
  });

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
    };

    // Get stats with optional recent data in a SINGLE aggregated call (no duplicate requests)
    const stats = await adminDashboardAggregator.getDashboardStats(correlationId, authHeaders, {
      includeRecent,
      recentLimit,
    });

    logger.info('[BFF] Dashboard stats completed successfully', { correlationId });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Failed to fetch dashboard stats', { error, correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
};

// ============================================================================
// User Management Controllers
// ============================================================================

/**
 * GET /api/admin/users
 * Get all users with optional filtering and pagination
 */
export const getAllUsers = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
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
};

/**
 * POST /api/admin/users
 * Create a new user
 */
export const createUser = async (req: Request, res: Response) => {
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
};

/**
 * PATCH /api/admin/users/:id
 * Update user
 */
export const updateUser = async (req: Request, res: Response) => {
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
};

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
export const deleteUser = async (req: Request, res: Response) => {
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
};

// ============================================================================
// Product Management Controllers
// ============================================================================

/**
 * GET /api/admin/products
 * Get all products with optional filtering and pagination
 */
export const getAllProducts = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/products/:id
 * Get product by ID
 */
export const getProductById = async (req: Request, res: Response) => {
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
};

/**
 * POST /api/admin/products
 * Create new product
 */
export const createProduct = async (req: Request, res: Response) => {
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
};

/**
 * PATCH /api/admin/products/:id
 * Update product
 */
export const updateProduct = async (req: Request, res: Response) => {
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
};

/**
 * DELETE /api/admin/products/:id
 * Delete product
 */
export const deleteProduct = async (req: Request, res: Response) => {
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
};

// ============================================================================
// Review Management Controllers
// ============================================================================

/**
 * GET /api/admin/reviews
 * Get all reviews with optional filtering
 */
export const getAllReviews = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/reviews/stats
 * Get review statistics for admin dashboard
 */
export const getReviewStats = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/reviews/:id
 * Get review by ID
 */
export const getReviewById = async (req: Request, res: Response) => {
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
};

/**
 * PATCH /api/admin/reviews/:id
 * Update review (approve/reject/moderate)
 */
export const updateReview = async (req: Request, res: Response) => {
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
};

/**
 * DELETE /api/admin/reviews/:id
 * Delete review
 */
export const deleteReview = async (req: Request, res: Response) => {
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
};

/**
 * POST /api/admin/reviews/bulk-delete
 * Bulk delete reviews
 */
export const bulkDeleteReviews = async (req: Request, res: Response) => {
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
};

// ============================================================================
// Order Management Controllers
// ============================================================================

/**
 * GET /api/admin/orders
 * Get all orders
 */
export const getAllOrders = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/orders/paged
 * Get orders with pagination
 */
export const getOrdersPaged = async (req: Request, res: Response) => {
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
};

/**
 * GET /api/admin/orders/:id
 * Get order by ID
 */
export const getOrderById = async (req: Request, res: Response) => {
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
};

/**
 * PUT /api/admin/orders/:id/status
 * Update order status
 */
export const updateOrderStatus = async (req: Request, res: Response) => {
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
};

/**
 * DELETE /api/admin/orders/:id
 * Delete order
 */
export const deleteOrder = async (req: Request, res: Response) => {
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
};
