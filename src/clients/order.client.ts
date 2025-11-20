import { DaprBaseClient } from './dapr.base.client';
import config from '@/core/config';

export interface Order {
  id: string;
  customerId: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  shippingStatus: string;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Address {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CreateOrderRequest {
  customerId: string;
  items: {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
  }[];
  shippingAddress: Address;
  billingAddress: Address;
  notes?: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class OrderClient extends DaprBaseClient {
  constructor() {
    super(config.services.order, 'order-service');
  }

  // Admin methods
  async getAllOrders(headers: Record<string, string>): Promise<Order[]> {
    return this.get<Order[]>('/api/orders', headers);
  }

  async getOrdersPaged(
    headers: Record<string, string>,
    params?: any
  ): Promise<PagedResponse<Order>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<PagedResponse<Order>>(`/api/admin/orders/paged${queryString}`, headers);
  }

  async getOrderById(orderId: string, headers: Record<string, string>): Promise<Order> {
    return this.get<Order>(`/api/admin/orders/${orderId}`, headers);
  }

  async updateOrderStatus(
    orderId: string,
    data: any,
    headers: Record<string, string>
  ): Promise<Order> {
    return this.put<Order>(`/api/admin/orders/${orderId}/status`, data, headers);
  }

  async deleteOrder(orderId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/admin/orders/${orderId}`, headers);
  }

  // Customer methods
  async createOrder(
    orderData: CreateOrderRequest,
    headers: Record<string, string>
  ): Promise<Order> {
    return this.post<Order>('/api/orders', orderData, headers);
  }

  async getMyOrders(customerId: string, headers: Record<string, string>): Promise<Order[]> {
    return this.get<Order[]>(`/api/orders/customer/${customerId}`, headers);
  }

  async getMyOrdersPaged(
    customerId: string,
    headers: Record<string, string>,
    params?: any
  ): Promise<PagedResponse<Order>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<PagedResponse<Order>>(
      `/api/orders/customer/${customerId}/paged${queryString}`,
      headers
    );
  }

  /**
   * Get comprehensive dashboard statistics for orders
   * This replaces multiple endpoints with a single optimized call
   */
  async getDashboardStats(
    headers: Record<string, string>,
    options?: {
      includeRecent?: boolean;
      recentLimit?: number;
      analyticsPeriod?: string;
    }
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options?.includeRecent) params.append('includeRecent', 'true');
    if (options?.recentLimit) params.append('recentLimit', options.recentLimit.toString());
    if (options?.analyticsPeriod) params.append('period', options.analyticsPeriod);

    const queryString = params.toString();
    const endpoint = queryString
      ? `/api/admin/orders/stats?${queryString}`
      : '/api/admin/orders/stats';

    return this.get<any>(endpoint, headers);
  }
}

export const orderClient = new OrderClient();
