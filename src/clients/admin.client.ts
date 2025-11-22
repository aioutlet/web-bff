import { DaprBaseClient } from '../core/daprBaseClient';
import config from '@/core/config';

/**
 * AdminClient handles all admin-specific operations
 * Routes all requests through admin-service, which acts as an admin gateway
 * admin-service then forwards requests to appropriate domain services
 */
export class AdminClient extends DaprBaseClient {
  constructor() {
    super(config.services.admin, 'admin-service');
  }

  // ============================================================================
  // User Admin Operations (admin-service → user-service)
  // ============================================================================

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

  // ============================================================================
  // Order Admin Operations (admin-service → order-service)
  // ============================================================================

  async getAllOrders(headers: Record<string, string>): Promise<any[]> {
    return this.get<any[]>('/api/admin/orders', headers);
  }

  async getOrdersPaged(headers: Record<string, string>, params?: any): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/api/admin/orders/paged${queryString}`, headers);
  }

  async getOrderById(orderId: string, headers: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/admin/orders/${orderId}`, headers);
  }

  async updateOrderStatus(
    orderId: string,
    data: any,
    headers: Record<string, string>
  ): Promise<any> {
    return this.put<any>(`/api/admin/orders/${orderId}/status`, data, headers);
  }

  async deleteOrder(orderId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/admin/orders/${orderId}`, headers);
  }

  async getDashboardStats(
    headers: Record<string, string>,
    options?: {
      includeRecent?: boolean;
      recentLimit?: number;
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options?.includeRecent) params.append('includeRecent', 'true');
    if (options?.recentLimit) params.append('recentLimit', options.recentLimit.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/admin/orders/stats?${queryString}`
      : '/api/admin/orders/stats';

    return this.get<any>(endpoint, headers);
  }

  // TODO: Add more admin operations as needed:
  // - Product admin operations (admin-service → product-service)
  // - Review admin operations (admin-service → review-service)
}

export const adminClient = new AdminClient();
