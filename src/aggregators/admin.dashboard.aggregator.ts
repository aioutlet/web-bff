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

export class AdminDashboardAggregator {
  /**
   * Aggregates dashboard statistics from multiple microservices
   * Now uses optimized getDashboardStats() endpoints - reduces from 10+ calls to 4 parallel calls
   * @param includeRecent - if true, fetches recent orders/users in same call (no duplicate requests)
   * @param recentLimit - number of recent items to fetch
   */
  async getDashboardStats(
    correlationId: string,
    authHeaders: Record<string, string>,
    options?: { includeRecent?: boolean; recentLimit?: number }
  ): Promise<DashboardStats & { recentOrders?: RecentOrder[]; recentUsers?: RecentUser[] }> {
    logger.info('Aggregating dashboard stats from microservices', { correlationId, options });

    const headers = {
      'x-correlation-id': correlationId,
      ...authHeaders,
    };

    const includeRecent = options?.includeRecent || false;
    const recentLimit = options?.recentLimit || 10;

    // Single optimized call per service - each returns comprehensive dashboard data
    // If includeRecent=true, this will get stats + recent data in ONE call (no duplicates)
    const [userStats, orderStats, productStats, reviewStats] = await Promise.allSettled([
      userClient.getDashboardStats(headers, { includeRecent, recentLimit }),
      orderClient.getDashboardStats(headers, { includeRecent, recentLimit }),
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
      const aggregatedStats: DashboardStats & {
        recentOrders?: RecentOrder[];
        recentUsers?: RecentUser[];
      } = {
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

      // Add recent data if it was requested (already fetched in the same calls above)
      if (includeRecent) {
        // Map recent orders from order service response
        if (orderStatsData.recentOrders && Array.isArray(orderStatsData.recentOrders)) {
          aggregatedStats.recentOrders = orderStatsData.recentOrders.map((order: any) => ({
            id: order.id,
            customer: order.customerName || order.customerId,
            total: order.totalAmount,
            status: order.status.toLowerCase(), // Already a string from backend
            createdAt: order.createdAt,
          }));
        }

        // Add recent users from user service response
        if (userStatsData.recentUsers && Array.isArray(userStatsData.recentUsers)) {
          aggregatedStats.recentUsers = userStatsData.recentUsers;
        }
      }

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
}

export const adminDashboardAggregator = new AdminDashboardAggregator();
