/**
 * Admin Dashboard Data Aggregator
 * Handles aggregation of data from multiple microservices for admin dashboard
 */

import { serviceCall } from '../clients/service.client';
import logger from '../observability/logging/index';
import config from '../config/index';

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

    // Parallel calls to different services for dashboard stats
    const [userStats, orders, productStats, reviewStats] = await Promise.allSettled([
      // User service stats
      serviceCall({
        method: 'GET',
        url: `${config.services.user}/api/admin/users/stats`,
        headers,
      }).catch(() => ({ total: 0, active: 0, newThisMonth: 0, growth: 0 })),

      // Order service - get all orders
      serviceCall({
        method: 'GET',
        url: `${config.services.order}/api/orders`,
        headers,
      }).catch(() => []),

      // Product service stats
      serviceCall({
        method: 'GET',
        url: `${config.services.product}/api/admin/stats`,
        headers,
      }).catch(() => ({ total: 0, active: 0, lowStock: 0, outOfStock: 0 })),

      // Review service stats
      serviceCall({
        method: 'GET',
        url: `${config.services.review}/api/v1/reviews/admin/stats`,
        headers,
      })
        .then((response: any) => response.data || response) // Extract data field if wrapped
        .catch(() => ({ total: 0, pending: 0, averageRating: 0, growth: 0 })),
    ]);

    try {
      // Process user stats (already calculated by user service)
      const userStatsData =
        userStats.status === 'fulfilled'
          ? userStats.value
          : { total: 0, active: 0, newThisMonth: 0, growth: 0 };

      // Process order data
      const orderList =
        orders.status === 'fulfilled' ? orders.value?.data || orders.value || [] : [];
      const orderArray = Array.isArray(orderList) ? orderList : [];
      const pendingOrders = orderArray.filter(
        (o: any) => o.status === 0 || o.status === 'Created'
      ).length;
      const processingOrders = orderArray.filter(
        (o: any) => o.status === 1 || o.status === 'Processing'
      ).length;
      const completedOrders = orderArray.filter(
        (o: any) => o.status === 3 || o.status === 'Delivered'
      ).length;
      const totalRevenue = orderArray.reduce(
        (sum: number, o: any) => sum + (o.totalAmount || 0),
        0
      );

      // Aggregate the stats from different services
      const aggregatedStats: DashboardStats = {
        users: {
          total: userStatsData.total || 0,
          active: userStatsData.active || 0,
          newThisMonth: userStatsData.newThisMonth || 0,
          growth: userStatsData.growth || 0,
        },
        orders: {
          total: orderArray.length,
          pending: pendingOrders,
          processing: processingOrders,
          completed: completedOrders,
          revenue: totalRevenue,
          growth: 8.3, // Mock growth
        },
        products: {
          total: productStats.status === 'fulfilled' ? productStats.value?.total || 0 : 0,
          active: productStats.status === 'fulfilled' ? productStats.value?.active || 0 : 0,
          lowStock: productStats.status === 'fulfilled' ? productStats.value?.lowStock || 0 : 0,
          outOfStock: productStats.status === 'fulfilled' ? productStats.value?.outOfStock || 0 : 0,
        },
        reviews: {
          total: reviewStats.status === 'fulfilled' ? reviewStats.value?.total || 0 : 0,
          pending: reviewStats.status === 'fulfilled' ? reviewStats.value?.pending || 0 : 0,
          averageRating:
            reviewStats.status === 'fulfilled' ? reviewStats.value?.averageRating || 0 : 0,
          growth: reviewStats.status === 'fulfilled' ? reviewStats.value?.growth || 0 : 0,
        },
      };

      logger.info('Dashboard stats aggregated successfully', {
        correlationId,
        servicesResponded: {
          users: userStats.status === 'fulfilled',
          orders: orders.status === 'fulfilled',
          products: productStats.status === 'fulfilled',
          reviews: reviewStats.status === 'fulfilled',
        },
        stats: {
          users: userStatsData.total,
          orders: orderArray.length,
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
      const response = await serviceCall({
        method: 'GET',
        url: `${config.services.order}/api/orders`,
        headers,
      });

      // Get the orders array (handle both wrapped and unwrapped responses)
      const orderList = response?.data || response || [];

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

    const recentUsers = await serviceCall({
      method: 'GET',
      url: `${config.services.user}/api/admin/users/list/recent?limit=${limit}`,
      headers,
    });

    return recentUsers || [];
  }

  /**
   * Aggregates analytics data from multiple services
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
      serviceCall({
        method: 'GET',
        url: `${config.services.user}/api/admin/analytics?period=${period}`,
        headers,
      }),

      serviceCall({
        method: 'GET',
        url: `${config.services.order}/api/admin/analytics?period=${period}`,
        headers,
      }),

      serviceCall({
        method: 'GET',
        url: `${config.services.product}/api/admin/analytics?period=${period}`,
        headers,
      }),
    ]);

    const analytics: AnalyticsData = {
      period,
      users: userAnalytics.status === 'fulfilled' ? userAnalytics.value : null,
      orders: orderAnalytics.status === 'fulfilled' ? orderAnalytics.value : null,
      products: productAnalytics.status === 'fulfilled' ? productAnalytics.value : null,
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
