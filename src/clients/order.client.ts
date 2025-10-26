import { BaseClient } from './base.client';
import config from '@config/index';

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

export class OrderClient extends BaseClient {
  constructor() {
    super(config.services.order, 'order-service');
  }

  // Admin methods
  async getAllOrders(headers: Record<string, string>): Promise<Order[]> {
    return this.get<Order[]>('/api/orders', { headers });
  }

  async getOrdersPaged(
    headers: Record<string, string>,
    params?: any
  ): Promise<PagedResponse<Order>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<PagedResponse<Order>>(`/api/orders/paged${queryString}`, { headers });
  }

  async getOrderById(orderId: string, headers: Record<string, string>): Promise<Order> {
    return this.get<Order>(`/api/orders/${orderId}`, { headers });
  }

  async updateOrderStatus(
    orderId: string,
    data: any,
    headers: Record<string, string>
  ): Promise<Order> {
    return this.client
      .put<Order>(`/api/orders/${orderId}/status`, data, { headers })
      .then((res) => res.data);
  }

  async deleteOrder(orderId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/orders/${orderId}`, { headers });
  }

  // Customer methods
  async createOrder(
    orderData: CreateOrderRequest,
    headers: Record<string, string>
  ): Promise<Order> {
    return this.post<Order>('/api/orders', orderData, { headers });
  }

  async getMyOrders(customerId: string, headers: Record<string, string>): Promise<Order[]> {
    return this.get<Order[]>(`/api/orders/customer/${customerId}`, { headers });
  }

  async getMyOrdersPaged(
    customerId: string,
    headers: Record<string, string>,
    params?: any
  ): Promise<PagedResponse<Order>> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<PagedResponse<Order>>(
      `/api/orders/customer/${customerId}/paged${queryString}`,
      { headers }
    );
  }
}

export const orderClient = new OrderClient();
