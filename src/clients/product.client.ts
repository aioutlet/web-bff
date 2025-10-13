import { BaseClient } from './base.client';
import config from '@config/index';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sku: string;
  images: string[];
  isActive: boolean;
}

export class ProductClient extends BaseClient {
  constructor() {
    super(config.services.product, 'product-service');
  }

  async getProduct(id: string): Promise<Product> {
    return this.get<Product>(`/api/products/${id}`);
  }

  async getTrendingProducts(limit: number = 4): Promise<Product[]> {
    return this.get<Product[]>(`/api/products/trending?limit=${limit}`);
  }

  async getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
    const url = `/api/products?category=${category}${limit ? `&limit=${limit}` : ''}`;
    return this.get<Product[]>(url);
  }

  async getCategories(): Promise<string[]> {
    return this.get<string[]>('/api/categories');
  }
}

export const productClient = new ProductClient();
