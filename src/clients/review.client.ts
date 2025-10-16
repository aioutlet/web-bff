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
    const response = await this.post<{ data: ReviewAggregate[] }>(
      '/api/v1/reviews/products/ratings/batch',
      { productIds }
    );
    return response.data;
  }
}

export const reviewClient = new ReviewClient();
