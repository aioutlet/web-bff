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
    return this.get<ReviewAggregate>(`/api/reviews/products/${productId}/aggregate`);
  }

  async getReviewsBatch(productIds: string[]): Promise<ReviewAggregate[]> {
    return this.post<ReviewAggregate[]>('/api/reviews/batch/aggregate', { productIds });
  }
}

export const reviewClient = new ReviewClient();
