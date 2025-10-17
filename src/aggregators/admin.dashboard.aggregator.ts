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
    const [userStats, orderStats, productStats, reviewStats] = await Promise.allSettled([
      // User service stats
      serviceCall({
        method: 'GET',
        url: `${config.services.user}/api/admin/users/stats`,
        headers,
      }).catch(() => ({ total: 0, active: 0, newThisMonth: 0, growth: 0 })),

      // Order service stats
      serviceCall({
        method: 'GET',
        url: `${config.services.order}/api/admin/stats`,
        headers,
      }).catch(() => ({
        total: 0,
        pending: 0,
        processing: 0,
        completed: 0,
        revenue: 0,
        growth: 0,
      })),

      // Product service stats
      serviceCall({
        method: 'GET',
        url: `${config.services.product}/api/admin/stats`,
        headers,
      }).catch(() => ({ total: 0, active: 0, lowStock: 0, outOfStock: 0 })),

      // Review service stats
      serviceCall({
        method: 'GET',
        url: `${config.services.review}/api/admin/stats`,
        headers,
      }).catch(() => ({ total: 0, pending: 0, averageRating: 0, growth: 0 })),
    ]);

    // Aggregate the stats from different services
    const aggregatedStats: DashboardStats = {
      users: {
        total: userStats.status === 'fulfilled' ? userStats.value?.total || 0 : 0,
        active: userStats.status === 'fulfilled' ? userStats.value?.active || 0 : 0,
        newThisMonth: userStats.status === 'fulfilled' ? userStats.value?.newThisMonth || 0 : 0,
        growth: userStats.status === 'fulfilled' ? userStats.value?.growth || 0 : 0,
      },
      orders: {
        total: orderStats.status === 'fulfilled' ? orderStats.value?.total || 0 : 0,
        pending: orderStats.status === 'fulfilled' ? orderStats.value?.pending || 0 : 0,
        processing: orderStats.status === 'fulfilled' ? orderStats.value?.processing || 0 : 0,
        completed: orderStats.status === 'fulfilled' ? orderStats.value?.completed || 0 : 0,
        revenue: orderStats.status === 'fulfilled' ? orderStats.value?.revenue || 0 : 0,
        growth: orderStats.status === 'fulfilled' ? orderStats.value?.growth || 0 : 0,
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
        orders: orderStats.status === 'fulfilled',
        products: productStats.status === 'fulfilled',
        reviews: reviewStats.status === 'fulfilled',
      },
    });

    return aggregatedStats;
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

    const recentOrders = await serviceCall({
      method: 'GET',
      url: `${config.services.order}/api/admin/orders/recent?limit=${limit}`,
      headers,
    });

    return recentOrders || [];
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
