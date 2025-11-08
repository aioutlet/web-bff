import { reviewClient } from '@clients/review.client';
import logger from '../core/logger';

export interface ReviewAggregates {
  average_rating: number;
  total_review_count: number;
  verified_review_count: number;
  rating_distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recent_reviews: string[];
  last_review_date?: string;
  last_updated: string;
}

export interface ProductData {
  id: string;
  name: string;
  description?: string;
  price: number;
  brand?: string;
  sku?: string;
  department?: string;
  category?: string;
  subcategory?: string;
  product_type?: string;
  images: string[];
  tags: string[];
  colors: string[];
  sizes: string[];
  specifications: Record<string, string>;
  review_aggregates?: ReviewAggregates;
  created_by: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface ReviewData {
  id: string;
  productId: string;
  userId: string;
  username: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  status: string;
  helpfulVotes: {
    helpful: number;
    notHelpful: number;
  };
  sentiment?: {
    score: number;
    label: string;
    confidence: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

/**
 * Fetch all reviews for a product (for dedicated reviews page)
 *
 * @param productId - The ID of the product
 * @param correlationId - Correlation ID for request tracing
 * @param skip - Number of reviews to skip (pagination)
 * @param limit - Maximum number of reviews to fetch
 * @param sort - Sort order (helpful, recent, rating)
 * @returns Reviews list with pagination
 */
export async function getProductReviews(
  productId: string,
  correlationId: string,
  skip: number = 0,
  limit: number = 20,
  sort: string = 'recent'
): Promise<{ reviews: ReviewData[]; total: number; hasMore: boolean }> {
  try {
    logger.info('Fetching product reviews', {
      correlationId,
      productId,
      skip,
      limit,
      sort,
    });

    const response = await reviewClient.getProductReviewsList(
      productId,
      {
        status: 'approved',
        skip,
        limit,
        sort,
      },
      { 'X-Correlation-Id': correlationId }
    );

    const reviews = response.data?.reviews || [];
    const total = response.data?.total || 0;
    const hasMore = skip + reviews.length < total;

    logger.info('Successfully fetched product reviews', {
      correlationId,
      productId,
      reviewCount: reviews.length,
      total,
      hasMore,
    });

    return {
      reviews,
      total,
      hasMore,
    };
  } catch (error) {
    logger.error('Error fetching product reviews', {
      correlationId,
      productId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
