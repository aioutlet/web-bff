/**
 * Admin Dashboard Data Aggregator
 * Handles aggregation of data from multiple microservices for admin dashboard
 */

import logger from '../core/logger';
import { userClient } from '../clients/user.client';
import { orderClient } from '../clients/order.client';
import { productClient } from '../clients/product.client';
import { reviewClient } from '../clients/review.client';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    newThisMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    revenue: number;
    growth: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
  };
  reviews: {
    total: number;
    pending: number;
    averageRating: number;
    growth: number;
  };
}

export interface RecentOrder {
  id: string;
  customer: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface RecentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface AnalyticsData {
  period: string;
  users: any;
  orders: any;
  products: any;
}

export class AdminDashboardAggregator {
  /**
   * Aggregates dashboard statistics from multiple microservices
   * Now uses optimized getDashboardStats() endpoints - reduces from 10+ calls to 4 parallel calls
   */
  async getDashboardStats(
    correlationId: string,
    authHeaders: Record<string, string>
  ): Promise<DashboardStats> {
    logger.info('Aggregating dashboard stats from microservices', { correlationId });

    const headers = {
      'x-correlation-id': correlationId,
      ...authHeaders,
    };

    // Single optimized call per service - each returns comprehensive dashboard data
    const [userStats, orderStats, productStats, reviewStats] = await Promise.allSettled([
      userClient.getDashboardStats(headers, { includeRecent: false }),
      orderClient.getDashboardStats(headers, { includeRecent: false }),
      productClient.getDashboardStats(headers, { includeRecent: false }),
      reviewClient.getDashboardStats(headers, { includeRecent: false }),
    ]);

    // Log any rejected promises for debugging
    if (userStats.status === 'rejected') {
      logger.error('User stats fetch failed', {
        error: userStats.reason?.message || userStats.reason,
        stack: userStats.reason?.stack,
        correlationId,
      });
    }
    if (orderStats.status === 'rejected') {
      logger.error('Order stats fetch failed', {
        error: orderStats.reason?.message || orderStats.reason,
        stack: orderStats.reason?.stack,
        correlationId,
      });
    }
    if (productStats.status === 'rejected') {
      logger.error('Product stats fetch failed', {
        error: productStats.reason?.message || productStats.reason,
        stack: productStats.reason?.stack,
        correlationId,
      });
    }
    if (reviewStats.status === 'rejected') {
      logger.error('Review stats fetch failed', {
        error: reviewStats.reason?.message || reviewStats.reason,
        stack: reviewStats.reason?.stack,
        correlationId,
      });
    }

    try {
      // Process user stats
      const userStatsData =
        userStats.status === 'fulfilled'
          ? userStats.value
          : { total: 0, active: 0, newThisMonth: 0, growth: 0 };

      // Process order stats
      const orderStatsData =
        orderStats.status === 'fulfilled'
          ? orderStats.value
          : { total: 0, pending: 0, processing: 0, completed: 0, revenue: 0, growth: 0 };

      // Process product stats
      const productStatsData =
        productStats.status === 'fulfilled'
          ? productStats.value
          : { total: 0, active: 0, lowStock: 0, outOfStock: 0 };

      // Process review stats
      const reviewStatsData =
        reviewStats.status === 'fulfilled'
          ? reviewStats.value?.data || reviewStats.value
          : { total: 0, pending: 0, averageRating: 0, growth: 0 };

      // Aggregate the stats from different services
      const aggregatedStats: DashboardStats = {
        users: {
          total: userStatsData.total || 0,
          active: userStatsData.active || 0,
          newThisMonth: userStatsData.newThisMonth || 0,
          growth: userStatsData.growth || 0,
        },
        orders: {
          total: orderStatsData.total || 0,
          pending: orderStatsData.pending || 0,
          processing: orderStatsData.processing || 0,
          completed: orderStatsData.completed || 0,
          revenue: orderStatsData.revenue || 0,
          growth: orderStatsData.growth || 0,
        },
        products: {
          total: productStatsData.total || 0,
          active: productStatsData.active || 0,
          lowStock: productStatsData.lowStock || 0,
          outOfStock: productStatsData.outOfStock || 0,
        },
        reviews: {
          total: reviewStatsData.total || 0,
          pending: reviewStatsData.pending || 0,
          averageRating: reviewStatsData.averageRating || 0,
          growth: reviewStatsData.growth || 0,
        },
      };

      logger.info('Dashboard stats aggregated successfully', {
        correlationId,
        servicesResponded: {
          users: userStats.status === 'fulfilled',
          orders: orderStats.status === 'fulfilled',
          products: productStats.status === 'fulfilled',
          reviews: reviewStats.status === 'fulfilled',
        },
        stats: {
          users: userStatsData.total,
          orders: orderStatsData.total,
        },
      });

      return aggregatedStats;
    } catch (error: any) {
      logger.error('Error processing dashboard stats', {
        correlationId,
        error: error.message,
        stack: error.stack,
      });

      // Return safe defaults on error
      return {
        users: { total: 0, active: 0, newThisMonth: 0, growth: 0 },
        orders: { total: 0, pending: 0, processing: 0, completed: 0, revenue: 0, growth: 0 },
        products: { total: 0, active: 0, lowStock: 0, outOfStock: 0 },
        reviews: { total: 0, pending: 0, averageRating: 0, growth: 0 },
      };
    }
  }

  /**
   * Fetches recent orders from order service
   */
  async getRecentOrders(
    limit: number,
    correlationId: string,
    authHeaders: Record<string, string>
  ): Promise<RecentOrder[]> {
    logger.info('Fetching recent orders for dashboard', { correlationId, limit });

    const headers = {
      'x-correlation-id': correlationId,
      ...authHeaders,
    };

    try {
      const orderList = await orderClient.getAllOrders(headers);

      // Sort by creation date (newest first) and limit
      const recentOrders = orderList
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit)
        .map((order: any) => ({
          id: order.id,
          customer: order.customerName,
          total: order.totalAmount,
          status: this.getOrderStatusName(order.status),
          createdAt: order.createdAt,
        }));

      return recentOrders;
    } catch (error) {
      logger.error('Failed to fetch recent orders', { error, correlationId });
      return [];
    }
  }

  /**
   * Helper to convert order status to display name
   */
  private getOrderStatusName(status: number | string): string {
    const statusMap: Record<string | number, string> = {
      0: 'pending',
      1: 'processing',
      2: 'shipped',
      3: 'completed',
      4: 'cancelled',
      Created: 'pending',
      Processing: 'processing',
      Shipped: 'shipped',
      Delivered: 'completed',
      Cancelled: 'cancelled',
    };
    return statusMap[status] || 'pending';
  }

  /**
   * Fetches recent users from user service
   * Uses optimized getDashboardStats with includeRecent option
   */
  async getRecentUsers(
    limit: number,
    correlationId: string,
    authHeaders: Record<string, string>
  ): Promise<RecentUser[]> {
    logger.info('Fetching recent users for dashboard', { correlationId, limit });

    const headers = {
      'x-correlation-id': correlationId,
      ...authHeaders,
    };

    try {
      const response = await userClient.getDashboardStats(headers, {
        includeRecent: true,
        recentLimit: limit,
      });

      return response.recentUsers || [];
    } catch (error) {
      logger.error('Failed to fetch recent users', { error, correlationId });
      return [];
    }
  }

  /**
   * Aggregates analytics data from multiple services
   * Uses optimized getDashboardStats with analytics period option
   */
  async getAnalyticsData(
    period: string,
    correlationId: string,
    authHeaders: Record<string, string>
  ): Promise<AnalyticsData> {
    logger.info('Fetching dashboard analytics', { correlationId, period });

    const headers = {
      'x-correlation-id': correlationId,
      ...authHeaders,
    };

    // Parallel calls for analytics data from multiple services
    const [userAnalytics, orderAnalytics, productAnalytics] = await Promise.allSettled([
      userClient.getDashboardStats(headers, { analyticsPeriod: period }),
      orderClient.getDashboardStats(headers, { analyticsPeriod: period }),
      productClient.getDashboardStats(headers, { analyticsPeriod: period }),
    ]);

    const analytics: AnalyticsData = {
      period,
      users: userAnalytics.status === 'fulfilled' ? userAnalytics.value?.analytics : null,
      orders: orderAnalytics.status === 'fulfilled' ? orderAnalytics.value?.analytics : null,
      products: productAnalytics.status === 'fulfilled' ? productAnalytics.value?.analytics : null,
    };

    logger.info('Analytics data aggregated', {
      correlationId,
      period,
      servicesResponded: {
        users: userAnalytics.status === 'fulfilled',
        orders: orderAnalytics.status === 'fulfilled',
        products: productAnalytics.status === 'fulfilled',
      },
    });

    return analytics;
  }
}

export const adminDashboardAggregator = new AdminDashboardAggregator();
