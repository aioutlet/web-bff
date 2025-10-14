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
    average_rating: number;
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
}

export const productClient = new ProductClient();
