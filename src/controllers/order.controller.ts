/**
 * Order Controller for Web BFF
 * Handles all order operations for authenticated users
 */

import { Response } from 'express';
import { asyncHandler } from '@middleware/asyncHandler.middleware';
import { orderClient } from '@clients/order.client';
import logger from '../core/logger';
import { RequestWithTraceContext } from '@middleware/traceContext.middleware';
import jwt from 'jsonwebtoken';

// ============================================================================
// Helper functions
// ============================================================================
const getToken = (req: RequestWithTraceContext): string | null => {
  return req.headers.authorization?.replace('Bearer ', '') || null;
};

const getUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.sub || decoded?.id || null;
  } catch (error) {
    logger.error('Error decoding JWT token', { error });
    return null;
  }
};

const requireAuth = (
  req: RequestWithTraceContext,
  res: Response
): { token: string; userId: string } | null => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required' },
    });
    return null;
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid authentication token' },
    });
    return null;
  }

  return { token, userId };
};

// ============================================================================
// Order Controllers
// ============================================================================

/**
 * POST /api/orders
 * Create a new order (customer only)
 */
export const createOrder = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {

const { traceId, spanId } = req;
const auth = requireAuth(req, res);
if (!auth) return;

logger.info('Creating order', {
  traceId, spanId,
  customerId: auth.userId,
});

// Fetch user profile to capture customer information snapshot
let customerName = '';
let customerEmail = '';
let customerPhone = '';

try {
  const { userClient } = await import('../clients/user.client');
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  
  if (token) {
    const userProfile = await userClient.getProfile(token);
    customerName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
    customerEmail = userProfile.email || '';
    customerPhone = userProfile.phoneNumber || '';
    
    logger.info('Fetched user profile for order', {
      traceId,
      spanId,
      customerId: auth.userId,
      customerName,
      customerPhone,
    });
  }
} catch (error: any) {
  logger.warn('Failed to fetch user profile, using JWT data only', {
    traceId,
    spanId,
    error: error.message,
  });
}

// Set customer information from JWT token and user profile
const orderData = {
  ...req.body,
  customerId: auth.userId,
  customerName,
  customerEmail,
  customerPhone,
};

// Forward JWT token to order service
const headers: Record<string, string> = {};
if (req.headers.authorization) {
  headers.Authorization = req.headers.authorization;
}
if (req.correlationId) {
  headers['X-Correlation-ID'] = req.correlationId;
}

console.log('[OrderController] Forwarding headers to order-service:', headers);

const order = await orderClient.createOrder(orderData, headers);

logger.info('Order created successfully', {
  traceId, spanId,
  orderId: order.id,
});

res.status(201).json({
  success: true,
  data: order,
});
});

/**
 * GET /api/orders/my
 * Get current user's orders
 */
export const getMyOrders = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {

const { traceId, spanId } = req;
const auth = requireAuth(req, res);
if (!auth) return;

logger.info('Fetching user orders', {
  traceId, spanId,
  customerId: auth.userId,
});

const headers: Record<string, string> = {};
if (req.headers.authorization) {
  headers.Authorization = req.headers.authorization;
}
if (req.correlationId) {
  headers['X-Correlation-ID'] = req.correlationId;
}

const orders = await orderClient.getMyOrders(auth.userId, headers);

res.json({
  success: true,
  data: orders,
});
});

/**
 * GET /api/orders/my/paged
 * Get current user's orders with pagination
 */
export const getMyOrdersPaged = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const auth = requireAuth(req, res);
    if (!auth) return;

    logger.info('Fetching user orders (paged)', {
      traceId, spanId,
      customerId: auth.userId,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    const headers: Record<string, string> = {};
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }
    if (req.correlationId) {
      headers['X-Correlation-ID'] = req.correlationId;
    }

    const params = {
      page: req.query.page || '1',
      pageSize: req.query.pageSize || '10',
    };

    const pagedOrders = await orderClient.getMyOrdersPaged(auth.userId, headers, params);

    res.json({
      success: true,
      data: pagedOrders,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Error fetching user orders (paged)', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to fetch orders',
      },
    });
  }
};

/**
 * GET /api/orders/:id
 * Get order by ID (customer can view own orders)
 */
export const getOrderById = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {

const { traceId, spanId } = req;
const auth = requireAuth(req, res);
if (!auth) return;

const { id } = req.params;

logger.info('Fetching order', {
  traceId, spanId,
  orderId: id,
});

const headers: Record<string, string> = {};
if (req.headers.authorization) {
  headers.Authorization = req.headers.authorization;
}
if (req.correlationId) {
  headers['X-Correlation-ID'] = req.correlationId;
}

const order = await orderClient.getOrderById(id, headers);

res.json({
  success: true,
  data: order,
});
});
