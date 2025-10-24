import { BaseClient } from './base.client';
import config from '@config/index';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface Address {
  id: string;
  userId: string;
  type: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAddressRequest {
  type: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

export interface PaymentMethod {
  id: string;
  userId: string;
  type: string;
  cardLast4?: string;
  cardBrand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodRequest {
  type: string;
  cardNumber?: string;
  cardholderName?: string;
  expiryMonth?: number;
  expiryYear?: number;
  cvv?: string;
  isDefault?: boolean;
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  addedAt: string;
}

export class UserClient extends BaseClient {
  constructor() {
    super(config.services.user, 'user-service');
  }

  // Profile methods
  async getProfile(token: string): Promise<UserProfile> {
    return this.get<UserProfile>('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updateProfile(data: UpdateProfileRequest, token: string): Promise<UserProfile> {
    return this.client
      .patch<UserProfile>('/api/users', data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => res.data);
  }

  async deleteAccount(token: string): Promise<void> {
    return this.delete<void>('/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Address methods
  async getAddresses(token: string): Promise<Address[]> {
    const response = await this.get<{ addresses: Address[] }>('/api/users/addresses', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.addresses || [];
  }

  async createAddress(data: CreateAddressRequest, token: string): Promise<Address> {
    return this.post<Address>('/api/users/addresses', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updateAddress(
    addressId: string,
    data: Partial<CreateAddressRequest>,
    token: string
  ): Promise<Address> {
    return this.client
      .patch<Address>(`/api/users/addresses/${addressId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => res.data);
  }

  async deleteAddress(addressId: string, token: string): Promise<void> {
    return this.delete<void>(`/api/users/addresses/${addressId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async setDefaultAddress(addressId: string, token: string): Promise<Address> {
    return this.client
      .patch<Address>(
        `/api/users/addresses/${addressId}/default`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => res.data);
  }

  // Payment method methods
  async getPaymentMethods(token: string): Promise<PaymentMethod[]> {
    const response = await this.get<{ paymentMethods: PaymentMethod[] }>(
      '/api/users/paymentmethods',
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.paymentMethods || [];
  }

  async createPaymentMethod(
    data: CreatePaymentMethodRequest,
    token: string
  ): Promise<PaymentMethod> {
    return this.post<PaymentMethod>('/api/users/paymentmethods', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updatePaymentMethod(
    paymentId: string,
    data: Partial<CreatePaymentMethodRequest>,
    token: string
  ): Promise<PaymentMethod> {
    return this.client
      .patch<PaymentMethod>(`/api/users/paymentmethods/${paymentId}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => res.data);
  }

  async deletePaymentMethod(paymentId: string, token: string): Promise<void> {
    return this.delete<void>(`/api/users/paymentmethods/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async setDefaultPaymentMethod(paymentId: string, token: string): Promise<PaymentMethod> {
    return this.client
      .patch<PaymentMethod>(
        `/api/users/paymentmethods/${paymentId}/default`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      .then((res) => res.data);
  }

  // Wishlist methods
  async getWishlist(token: string): Promise<WishlistItem[]> {
    const response = await this.get<{ wishlist: WishlistItem[] }>('/api/users/wishlist', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.wishlist || [];
  }

  async addToWishlist(productId: string, token: string): Promise<WishlistItem> {
    return this.post<WishlistItem>(
      '/api/users/wishlist',
      { productId },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  }

  async removeFromWishlist(wishlistId: string, token: string): Promise<void> {
    return this.delete<void>(`/api/users/wishlist/${wishlistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // Admin methods
  async getAllUsers(headers: Record<string, string>): Promise<any[]> {
    return this.get<any[]>('/api/admin/users', { headers });
  }

  async getUserById(userId: string, headers: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/admin/users/${userId}`, { headers });
  }

  async createUserAdmin(data: any, headers: Record<string, string>): Promise<any> {
    return this.post<any>('/api/admin/users', data, { headers });
  }

  async updateUserAdmin(
    userId: string,
    data: Partial<any>,
    headers: Record<string, string>
  ): Promise<any> {
    return this.client
      .patch<any>(`/api/admin/users/${userId}`, data, { headers })
      .then((res) => res.data);
  }

  async deleteUserAdmin(userId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/admin/users/${userId}`, { headers });
  }
}

export const userClient = new UserClient();
