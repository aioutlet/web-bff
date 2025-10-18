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

export interface TrendingCategory {
  name: string;
  product_count: number;
  in_stock_count: number;
  avg_rating: number;
  total_reviews: number;
  trending_score: number;
  featured_product: {
    name: string;
    price: number;
    images: string[];
  };
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

  async getTrendingCategories(limit: number = 5): Promise<TrendingCategory[]> {
    return this.get<TrendingCategory[]>(`/api/products/trending-categories?limit=${limit}`);
  }

  async getProductsByCategory(category: string, limit?: number): Promise<Product[]> {
    const url = `/api/products?category=${category}${limit ? `&limit=${limit}` : ''}`;
    return this.get<Product[]>(url);
  }

  async getCategories(): Promise<string[]> {
    return this.get<string[]>('/api/categories');
  }

  async getProductCount(department: string, category: string): Promise<number> {
    const response = await this.get<{ total_count: number; products: Product[] }>(
      `/api/products/?department=${department}&category=${category}&limit=1`
    );
    return response.total_count || 0;
  }

  // Admin methods
  async getAllProducts(headers: Record<string, string>, params?: any): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/api/products${queryString}`, { headers });
  }

  async getProductById(productId: string, headers: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/products/${productId}`, { headers });
  }

  async createProduct(data: any, headers: Record<string, string>): Promise<any> {
    return this.post<any>('/api/products', data, { headers });
  }

  async updateProduct(productId: string, data: any, headers: Record<string, string>): Promise<any> {
    return this.client
      .patch<any>(`/api/products/${productId}`, data, { headers })
      .then((res) => res.data);
  }

  async deleteProduct(productId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/products/${productId}`, { headers });
  }
}

export const productClient = new ProductClient();
