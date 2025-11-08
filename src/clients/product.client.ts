import { DaprBaseClient } from './dapr.base.client';
import config from '@/core/config';

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

export interface StorefrontData {
  trending_products: Product[];
  trending_categories: TrendingCategory[];
}

export class ProductClient extends DaprBaseClient {
  constructor() {
    super(config.services.product, 'product-service');
  }

  async getProduct(id: string): Promise<Product> {
    return this.get<Product>(`/api/products/${id}`);
  }

  /**
   * Get combined storefront data (trending products + categories) in one call
   * Optimized endpoint that reduces round trips to product service
   * Works with both Dapr and direct HTTP
   */
  async getStorefrontData(
    productsLimit: number = 4,
    categoriesLimit: number = 5
  ): Promise<StorefrontData> {
    return this.get<StorefrontData>(
      `/api/products/storefront-data?products_limit=${productsLimit}&categories_limit=${categoriesLimit}`
    );
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

  async getProductDetailsById(productId: string, headers?: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/products/${productId}`, headers);
  }

  async getProducts(
    params?: Record<string, string>,
    headers?: Record<string, string>
  ): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/api/products/${queryString}`, headers);
  }

  async searchProducts(
    params?: Record<string, string>,
    headers?: Record<string, string>
  ): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/api/products/search${queryString}`, headers);
  }

  // Admin methods
  async getAllProducts(headers: Record<string, string>, params?: any): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/api/products${queryString}`, headers);
  }

  async getProductById(productId: string, headers: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/products/${productId}`, headers);
  }

  async createProduct(data: any, headers: Record<string, string>): Promise<any> {
    return this.post<any>('/api/products', data, headers);
  }

  async updateProduct(productId: string, data: any, headers: Record<string, string>): Promise<any> {
    return this.patch<any>(`/api/products/${productId}`, data, headers);
  }

  async deleteProduct(productId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/products/${productId}`, headers);
  }

  /**
   * Get comprehensive dashboard statistics for products
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
      ? `/api/admin/products/stats?${queryString}`
      : '/api/admin/products/stats';

    return this.get<any>(endpoint, headers);
  }
}

export const productClient = new ProductClient();
