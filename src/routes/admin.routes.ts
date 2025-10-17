/**
 * Admin Dashboard Routes for Web BFF
 * Aggregates data from multiple services for admin dashboard
 */

import { Router, Request, Response } from 'express';
import logger from '../observability/logging/index';
import { adminDashboardAggregator } from '../aggregators/admin.dashboard.aggregator';

const router = Router();

/**
 * Dashboard Stats Aggregation
 * Aggregates stats from multiple microservices via dedicated aggregator
 */
router.get('/dashboard/stats', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
    };

    const stats = await adminDashboardAggregator.getDashboardStats(correlationId, authHeaders);

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
});

/**
 * Recent Orders
 * Fetches recent orders via aggregator
 */
router.get('/dashboard/recent-orders', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
    };

    const recentOrders = await adminDashboardAggregator.getRecentOrders(
      limit,
      correlationId,
      authHeaders
    );

    res.json({
      success: true,
      data: recentOrders,
    });
  } catch (error) {
    logger.error('Failed to fetch recent orders', { error, correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent orders',
      data: [], // Return empty array as fallback
    });
  }
});

/**
 * Recent Users
 * Fetches recent users via aggregator
 */
router.get('/dashboard/recent-users', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const limit = parseInt(req.query.limit as string) || 5;

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
    };

    const recentUsers = await adminDashboardAggregator.getRecentUsers(
      limit,
      correlationId,
      authHeaders
    );

    res.json({
      success: true,
      data: recentUsers,
    });
  } catch (error) {
    logger.error('Failed to fetch recent users', { error, correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent users',
      data: [], // Return empty array as fallback
    });
  }
});

/**
 * Analytics Data
 * Fetches analytics via aggregator
 */
router.get('/dashboard/analytics', async (req: Request, res: Response) => {
  const correlationId = req.get('x-correlation-id') || 'no-correlation';
  const period = (req.query.period as string) || '7d';

  try {
    const authHeaders = {
      authorization: req.get('authorization') || '',
    };

    const analytics = await adminDashboardAggregator.getAnalyticsData(
      period,
      correlationId,
      authHeaders
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Failed to fetch analytics data', { error, correlationId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics data',
      data: {
        period,
        users: null,
        orders: null,
        products: null,
      },
    });
  }
});

// Additional admin routes can be added here for specific operations
// For now, focusing on dashboard data aggregation

export default router;
