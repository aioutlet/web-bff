import { DaprBaseClient } from './dapr.base.client';
import config from '@/core/config';

interface CartItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface Cart {
  userId: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  updatedAt: string;
}

interface AddItemRequest {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

/**
 * Client for cart service operations
 */
class CartClient extends DaprBaseClient {
  constructor() {
    super(config.services.cart, 'cart-service');
  }

  /**
   * Get authenticated user's cart
   */
  async getCart(headers: Record<string, string>): Promise<Cart> {
    return this.get<Cart>('/api/v1/cart', headers);
  }

  /**
   * Add item to authenticated user's cart
   */
  async addItem(item: AddItemRequest, headers: Record<string, string>): Promise<Cart> {
    return this.post<Cart>('/api/v1/cart/items', item, headers);
  }

  /**
   * Update item quantity in authenticated user's cart
   */
  async updateItem(
    productId: string,
    quantity: number,
    headers: Record<string, string>
  ): Promise<Cart> {
    return this.put<Cart>(`/api/v1/cart/items/${productId}`, { quantity }, headers);
  }

  /**
   * Remove item from authenticated user's cart
   */
  async removeItem(productId: string, headers: Record<string, string>): Promise<Cart> {
    return this.delete<Cart>(`/api/v1/cart/items/${productId}`, headers);
  }

  /**
   * Clear authenticated user's cart
   */
  async clearCart(headers: Record<string, string>): Promise<void> {
    return this.delete<void>('/api/v1/cart', headers);
  }

  /**
   * Transfer guest cart to authenticated user
   */
  async transferCart(guestId: string, headers: Record<string, string>): Promise<Cart> {
    return this.post<Cart>('/api/v1/cart/transfer', { guestId }, headers);
  }

  /**
   * Get guest cart
   */
  async getGuestCart(guestId: string): Promise<Cart> {
    return this.get<Cart>(`/api/v1/guest/cart/${guestId}`);
  }

  /**
   * Add item to guest cart
   */
  async addGuestItem(guestId: string, item: AddItemRequest): Promise<Cart> {
    return this.post<Cart>(`/api/v1/guest/cart/${guestId}/items`, item);
  }

  /**
   * Update item quantity in guest cart
   */
  async updateGuestItem(guestId: string, productId: string, quantity: number): Promise<Cart> {
    return this.put<Cart>(`/api/v1/guest/cart/${guestId}/items/${productId}`, { quantity });
  }

  /**
   * Remove item from guest cart
   */
  async removeGuestItem(guestId: string, productId: string): Promise<Cart> {
    return this.delete<Cart>(`/api/v1/guest/cart/${guestId}/items/${productId}`);
  }

  /**
   * Clear guest cart
   */
  async clearGuestCart(guestId: string): Promise<void> {
    return this.delete<void>(`/api/v1/guest/cart/${guestId}`);
  }
}

export const cartClient = new CartClient();
