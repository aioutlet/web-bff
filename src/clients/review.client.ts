import { DaprBaseClient } from './dapr.base.client';
import config from '@/core/config';

export interface ReviewAggregate {
  productId: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class ReviewClient extends DaprBaseClient {
  constructor() {
    super(config.services.review, 'review-service');
  }

  async getProductReviews(productId: string): Promise<ReviewAggregate> {
    const response = await this.get<{ data: ReviewAggregate }>(
      `/api/reviews/products/${productId}/rating`
    );
    return response.data;
  }

  async getReviewsBatch(productIds: string[]): Promise<ReviewAggregate[]> {
    const response = await this.post<{ data: ReviewAggregate[] }>(
      '/api/reviews/products/ratings/batch',
      { productIds }
    );

    return response.data;
  }

  async getProductReviewsList(
    productId: string,
    params?: {
      status?: string;
      limit?: number;
      skip?: number;
      sort?: string;
    },
    headers?: Record<string, string>
  ): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.get<any>(`/api/reviews/product/${productId}${queryString}`, headers);
  }

  async getProductRating(productId: string, headers?: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/reviews/products/${productId}/rating`, headers);
  }

  // Admin methods
  async getAllReviews(headers: Record<string, string>, params?: any): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/api/admin/reviews/all${queryString}`, headers);
  }

  /**
   * Get comprehensive dashboard statistics for reviews
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
      ? `/api/admin/reviews/stats?${queryString}`
      : '/api/admin/reviews/stats';

    return this.get<any>(endpoint, headers);
  }

  async getReviewById(reviewId: string, headers: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/reviews/${reviewId}`, headers);
  }

  async updateReview(reviewId: string, data: any, headers: Record<string, string>): Promise<any> {
    return this.put<any>(`/api/reviews/${reviewId}`, data, headers);
  }

  async deleteReview(reviewId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/reviews/${reviewId}`, headers);
  }

  async bulkDeleteReviews(reviewIds: string[], headers: Record<string, string>): Promise<any> {
    return this.post<any>('/api/reviews/admin/bulk-delete', { reviewIds }, headers);
  }
}

export const reviewClient = new ReviewClient();
