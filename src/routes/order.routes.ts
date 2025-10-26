import { Router, Response } from 'express';
import { orderClient } from '@clients/order.client';
import logger from '@observability';
import { RequestWithCorrelationId } from '@middleware/correlation-id.middleware';
import jwt from 'jsonwebtoken';

const router = Router();

// ============================================================================
// Helper functions
// ============================================================================
const getToken = (req: RequestWithCorrelationId): string | null => {
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
  req: RequestWithCorrelationId,
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

/**
 * POST /api/orders
 * Create a new order (customer only)
 */
router.post('/', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    logger.info('Creating order', {
      correlationId: req.correlationId,
      customerId: auth.userId,
    });

    // Set customer ID from JWT token
    const orderData = {
      ...req.body,
      customerId: auth.userId,
    };

    // Forward JWT token to order service
    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    const order = await orderClient.createOrder(orderData, headers);

    logger.info('Order created successfully', {
      correlationId: req.correlationId,
      orderId: order.id,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('Error creating order', {
      correlationId: req.correlationId,
      error: error.message,
      statusCode: error.response?.status,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to create order',
      },
    });
  }
});

/**
 * GET /api/orders/my
 * Get current user's orders
 */
router.get('/my', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    logger.info('Fetching user orders', {
      correlationId: req.correlationId,
      customerId: auth.userId,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    const orders = await orderClient.getMyOrders(auth.userId, headers);

    res.json({
      success: true,
      data: orders,
    });
  } catch (error: any) {
    logger.error('Error fetching user orders', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to fetch orders',
      },
    });
  }
});

/**
 * GET /api/orders/my/paged
 * Get current user's orders with pagination
 */
router.get('/my/paged', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    logger.info('Fetching user orders (paged)', {
      correlationId: req.correlationId,
      customerId: auth.userId,
      page: req.query.page,
      pageSize: req.query.pageSize,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

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
    logger.error('Error fetching user orders (paged)', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to fetch orders',
      },
    });
  }
});

/**
 * GET /api/orders/:id
 * Get order by ID (customer can view own orders)
 */
router.get('/:id', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const { id } = req.params;

    logger.info('Fetching order', {
      correlationId: req.correlationId,
      orderId: id,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    const order = await orderClient.getOrderById(id, headers);

    res.json({
      success: true,
      data: order,
    });
  } catch (error: any) {
    logger.error('Error fetching order', {
      correlationId: req.correlationId,
      orderId: req.params.id,
      error: error.message,
    });

    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to fetch order',
      },
    });
  }
});

export default router;
