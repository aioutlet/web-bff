import { BaseClient } from './base.client';
import config from '@config/index';
import {
  DashboardStats,
  RecentOrder,
  RecentUser,
  AnalyticsData,
} from '../aggregators/admin.dashboard.aggregator';

export class AdminClient extends BaseClient {
  constructor() {
    super(config.services.admin, 'admin-service');
  }

  async getStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>('/api/admin/stats');
  }

  async getRecentOrders(limit: number = 5): Promise<RecentOrder[]> {
    return this.get<RecentOrder[]>(`/api/admin/orders/recent?limit=${limit}`);
  }

  async getRecentUsers(limit: number = 5): Promise<RecentUser[]> {
    return this.get<RecentUser[]>(`/api/admin/users/recent?limit=${limit}`);
  }

  async getAnalytics(period: string = '7d'): Promise<AnalyticsData> {
    return this.get<AnalyticsData>(`/api/admin/analytics?period=${period}`);
  }
}

export const adminClient = new AdminClient();
