import { DaprBaseClient } from './dapr.base.client';
import config from '@/core/config';

/**
 * AdminClient handles admin-specific operations across domain services
 * This client is for admin CRUD operations only, NOT for aggregation
 * Dashboard aggregation is handled by admin.dashboard.aggregator.ts
 */
export class AdminClient extends DaprBaseClient {
  constructor() {
    super(config.services.admin, 'admin-service');
  }

  // User Admin Operations (calls user-service via admin endpoints)
  async getAllUsers(headers: Record<string, string>): Promise<any[]> {
    return this.get<any[]>('/api/admin/users', headers);
  }

  async getUserById(userId: string, headers: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/admin/users/${userId}`, headers);
  }

  async createUser(data: any, headers: Record<string, string>): Promise<any> {
    return this.post<any>('/api/admin/users', data, headers);
  }

  async updateUser(
    userId: string,
    data: Partial<any>,
    headers: Record<string, string>
  ): Promise<any> {
    return this.patch<any>(`/api/admin/users/${userId}`, data, headers);
  }

  async deleteUser(userId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/admin/users/${userId}`, headers);
  }

  // TODO: Add more admin operations as needed:
  // - Product admin operations
  // - Order admin operations
  // - Review admin operations
}

export const adminClient = new AdminClient();
