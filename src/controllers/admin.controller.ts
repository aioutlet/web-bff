/**
 * Admin Controller for Web BFF
 * Handles all admin-related operations including dashboard, user, product, review, and order management
 * Refactored to use asyncHandler middleware for cleaner error handling
 */

import { Response } from 'express';
import { RequestWithTraceContext } from '@middleware/traceContext.middleware';
import { asyncHandler } from '@middleware/asyncHandler.middleware';
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
export const getDashboardStats = asyncHandler(
  async (req: RequestWithTraceContext, res: Response) => {
    const { traceId, spanId } = req;
    const includeRecent = req.query.includeRecent === 'true';
    const recentLimit = parseInt(req.query.recentLimit as string) || 10;

    logger.info('[BFF] Dashboard stats endpoint called', {
      traceId,
      spanId,
      includeRecent,
      recentLimit,
      timestamp: new Date().toISOString(),
    });

    const authHeaders = {
      authorization: req.get('authorization') || '',
    };

    const stats = await adminDashboardAggregator.getDashboardStats(traceId, spanId, authHeaders, {
      includeRecent,
      recentLimit,
    });

    logger.info('[BFF] Dashboard stats completed successfully', { traceId, spanId });

    res.json({
      success: true,
      data: stats,
    });
  }
);

// ============================================================================
// User Management Controllers
// ============================================================================

export const getAllUsers = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { adminClient } = await import('../clients/admin.client');
  const users = await adminClient.getAllUsers(authHeaders);

  res.json({
    success: true,
    data: users,
  });
});

export const getUserById = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { adminClient } = await import('../clients/admin.client');
  const user = await adminClient.getUserById(id, authHeaders);

  res.json({
    success: true,
    data: user,
  });
});

export const createUser = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { adminClient } = await import('../clients/admin.client');
  const user = await adminClient.createUser(req.body, authHeaders);

  res.status(201).json({
    success: true,
    data: user,
  });
});

export const updateUser = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { adminClient } = await import('../clients/admin.client');
  const user = await adminClient.updateUser(id, req.body, authHeaders);

  res.json({
    success: true,
    data: user,
  });
});

export const deleteUser = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { adminClient } = await import('../clients/admin.client');
  await adminClient.deleteUser(id, authHeaders);

  res.status(204).send();
});

// ============================================================================
// Product Management Controllers
// ============================================================================

export const getAllProducts = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
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
});

export const getProductById = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { productClient } = await import('../clients/product.client');
  const product = await productClient.getProductById(id, authHeaders);

  res.json({
    success: true,
    data: product,
  });
});

export const createProduct = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { productClient } = await import('../clients/product.client');
  const product = await productClient.createProduct(req.body, authHeaders);

  res.status(201).json({
    success: true,
    data: product,
  });
});

export const updateProduct = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { productClient } = await import('../clients/product.client');
  const product = await productClient.updateProduct(id, req.body, authHeaders);

  res.json({
    success: true,
    data: product,
  });
});

export const deleteProduct = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { productClient } = await import('../clients/product.client');
  await productClient.deleteProduct(id, authHeaders);

  res.status(204).send();
});

// ============================================================================
// Review Management Controllers
// ============================================================================

export const getAllReviews = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
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
});

export const getReviewStats = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { reviewClient } = await import('../clients/review.client');
  const stats = await reviewClient.getDashboardStats(authHeaders);

  res.json({
    success: true,
    data: stats.data || stats,
  });
});

export const getReviewById = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { reviewClient } = await import('../clients/review.client');
  const review = await reviewClient.getReviewById(id, authHeaders);

  res.json({
    success: true,
    data: review.data || review,
  });
});

export const updateReview = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { reviewClient } = await import('../clients/review.client');
  const review = await reviewClient.updateReview(id, req.body, authHeaders);

  res.json({
    success: true,
    data: review.data || review,
  });
});

export const deleteReview = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { reviewClient } = await import('../clients/review.client');
  await reviewClient.deleteReview(id, authHeaders);

  res.status(204).send();
});

export const bulkDeleteReviews = asyncHandler(
  async (req: RequestWithTraceContext, res: Response) => {
    const { traceId, spanId } = req;

    const authHeaders = {
      authorization: req.get('authorization') || '',
      traceparent: `00-${traceId}-${spanId}-01`,
    };

    const { reviewClient } = await import('../clients/review.client');
    const result = await reviewClient.bulkDeleteReviews(req.body.reviewIds, authHeaders);

    res.json({
      success: true,
      data: result.data || result,
    });
  }
);

// ============================================================================
// Order Management Controllers
// ============================================================================

export const getAllOrders = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { orderClient } = await import('../clients/order.client');
  const orders = await orderClient.getAllOrders(authHeaders);

  res.json({
    success: true,
    data: orders,
  });
});

export const getOrdersPaged = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
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
});

export const getOrderById = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { orderClient } = await import('../clients/order.client');
  const order = await orderClient.getAdminOrderById(id, authHeaders);

  res.json({
    success: true,
    data: order,
  });
});

export const updateOrderStatus = asyncHandler(
  async (req: RequestWithTraceContext, res: Response) => {
    const { traceId, spanId } = req;
    const { id } = req.params;

    const authHeaders = {
      authorization: req.get('authorization') || '',
      traceparent: `00-${traceId}-${spanId}-01`,
    };

    const { orderClient } = await import('../clients/order.client');
    const order = await orderClient.updateOrderStatus(id, req.body, authHeaders);

    res.json({
      success: true,
      data: order,
    });
  }
);

export const deleteOrder = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  const authHeaders = {
    authorization: req.get('authorization') || '',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const { orderClient } = await import('../clients/order.client');
  await orderClient.deleteOrder(id, authHeaders);

  res.status(204).send();
});
