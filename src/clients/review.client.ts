import { BaseClient } from './base.client';
import config from '@config/index';

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

export class ReviewClient extends BaseClient {
  constructor() {
    super(config.services.review, 'review-service');
  }

  async getProductReviews(productId: string): Promise<ReviewAggregate> {
    const response = await this.get<{ data: ReviewAggregate }>(
      `/api/v1/reviews/products/${productId}/rating`
    );
    return response.data;
  }

  async getReviewsBatch(productIds: string[]): Promise<ReviewAggregate[]> {
    console.log('[BFF-ReviewClient] getReviewsBatch called with productIds:', productIds);
    console.log(
      '[BFF-ReviewClient] Making request to URL:',
      '/api/v1/reviews/products/ratings/batch'
    );
    console.log('[BFF-ReviewClient] Request payload:', { productIds });

    const response = await this.post<{ data: ReviewAggregate[] }>(
      '/api/v1/reviews/products/ratings/batch',
      { productIds }
    );

    console.log('[BFF-ReviewClient] Raw response received:', JSON.stringify(response, null, 2));
    console.log('[BFF-ReviewClient] Response data:', JSON.stringify(response.data, null, 2));

    return response.data;
  }

  // Admin methods
  async getAllReviews(headers: Record<string, string>, params?: any): Promise<any> {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get<any>(`/api/v1/reviews/admin/all${queryString}`, { headers });
  }

  async getStats(headers: Record<string, string>): Promise<any> {
    return this.get<any>('/api/v1/reviews/admin/stats', { headers });
  }

  async getReviewById(reviewId: string, headers: Record<string, string>): Promise<any> {
    return this.get<any>(`/api/v1/reviews/${reviewId}`, { headers });
  }

  async updateReview(reviewId: string, data: any, headers: Record<string, string>): Promise<any> {
    return this.client
      .put<any>(`/api/v1/reviews/${reviewId}`, data, { headers })
      .then((res) => res.data);
  }

  async deleteReview(reviewId: string, headers: Record<string, string>): Promise<void> {
    return this.delete<void>(`/api/v1/reviews/${reviewId}`, { headers });
  }

  async bulkDeleteReviews(reviewIds: string[], headers: Record<string, string>): Promise<any> {
    return this.post<any>('/api/v1/reviews/admin/bulk-delete', { reviewIds }, { headers });
  }
}

export const reviewClient = new ReviewClient();
