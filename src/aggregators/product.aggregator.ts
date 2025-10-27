import axios from 'axios';
import logger from '@observability';
import config from '@config/index';
import { reviewClient } from '@clients/review.client';

const REVIEW_SERVICE_URL = config.services.review;
const PRODUCT_SERVICE_URL = config.services.product;

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

export interface ProductRatingData {
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
  verifiedPurchaseRating?: number;
  verifiedReviewsCount: number;
  qualityMetrics: {
    averageHelpfulScore: number;
    totalHelpfulVotes: number;
    reviewsWithMedia: number;
    averageReviewLength: number;
  };
  trends: {
    last30Days: {
      totalReviews: number;
      averageRating: number;
    };
    last7Days: {
      totalReviews: number;
      averageRating: number;
    };
  };
  lastUpdated: string;
}

interface AggregatedProduct extends ProductData {
  reviews: ReviewData[];
  ratingDetails?: ProductRatingData;
}

/**
 * Aggregates product data with reviews from review-service
 * Uses fast product_ratings collection for performance
 *
 * @param productId - The ID of the product to aggregate
 * @param correlationId - Correlation ID for request tracing
 * @param limit - Maximum number of reviews to fetch (default: 5 for product detail page)
 * @param includeRatingDetails - Whether to include detailed rating analytics
 * @returns Aggregated product with reviews
 */
export async function aggregateProductWithReviews(
  productId: string,
  correlationId: string,
  limit: number = 5,
  includeRatingDetails: boolean = true
): Promise<AggregatedProduct> {
  try {
    logger.info('Aggregating product with reviews', {
      correlationId,
      productId,
      reviewLimit: limit,
      includeRatingDetails,
    });

    // Prepare parallel requests
    const requests = [
      // Product data from product service
      axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`, {
        headers: { 'X-Correlation-Id': correlationId },
        timeout: 5000,
      }),
      // Individual reviews for display
      axios.get(`${REVIEW_SERVICE_URL}/api/v1/reviews/product/${productId}`, {
        params: {
          status: 'approved',
          limit,
          sort: 'helpful', // Sort by most helpful reviews
        },
        headers: { 'X-Correlation-Id': correlationId },
        timeout: 5000,
      }),
    ];

    // Add rating details request if needed
    if (includeRatingDetails) {
      requests.push(
        axios.get(`${REVIEW_SERVICE_URL}/api/v1/reviews/products/${productId}/rating`, {
          headers: { 'X-Correlation-Id': correlationId },
          timeout: 3000, // Faster timeout for cached data
        })
      );
    }

    const responses = await Promise.allSettled(requests);

    // Handle product response
    const productResponse = responses[0];
    if (productResponse.status === 'rejected') {
      logger.error('Failed to fetch product', {
        correlationId,
        productId,
        error: productResponse.reason,
      });
      throw new Error(`Failed to fetch product: ${productResponse.reason.message}`);
    }

    const product: ProductData = productResponse.value.data;

    // Handle reviews response (non-critical - can proceed without reviews)
    let reviews: ReviewData[] = [];
    const reviewsResponse = responses[1];
    if (reviewsResponse.status === 'fulfilled') {
      reviews = reviewsResponse.value.data.data?.reviews || [];
      logger.info('Successfully fetched reviews', {
        correlationId,
        productId,
        reviewCount: reviews.length,
      });
    } else {
      logger.warn('Failed to fetch reviews, proceeding without them', {
        correlationId,
        productId,
        error: reviewsResponse.reason.message,
      });
    }

    // Handle rating details response (enhances product data)
    let ratingDetails: ProductRatingData | undefined;
    if (includeRatingDetails && responses[2]) {
      const ratingResponse = responses[2];
      if (ratingResponse.status === 'fulfilled') {
        ratingDetails = ratingResponse.value.data.data;
        logger.info('Successfully fetched rating details', {
          correlationId,
          productId,
          totalReviews: ratingDetails?.totalReviews,
          averageRating: ratingDetails?.averageRating,
        });
      } else {
        logger.warn('Failed to fetch rating details, using product service data', {
          correlationId,
          productId,
          error: ratingResponse.reason.message,
        });
      }
    }

    // Combine product and reviews with enhanced rating data
    const aggregatedProduct: AggregatedProduct = {
      ...product,
      reviews,
      ratingDetails,
    };

    logger.info('Product aggregation successful', {
      correlationId,
      productId,
      reviewCount: reviews.length,
      hasRatingDetails: !!ratingDetails,
    });

    return aggregatedProduct;
  } catch (error) {
    logger.error('Error aggregating product with reviews', {
      correlationId,
      productId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
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

    const response = await axios.get(`${REVIEW_SERVICE_URL}/api/v1/reviews/product/${productId}`, {
      params: {
        status: 'approved',
        skip,
        limit,
        sort,
      },
      headers: { 'X-Correlation-Id': correlationId },
      timeout: 5000,
    });

    const reviews = response.data.data?.reviews || [];
    const total = response.data.data?.total || 0;
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

/**
 * Fetch product ratings in batch for product listings
 * Uses fast product_ratings collection for optimal performance
 *
 * @param productIds - Array of product IDs
 * @param correlationId - Correlation ID for request tracing
 * @returns Array of product ratings
 */
export async function getProductRatingsBatch(
  productIds: string[],
  correlationId: string
): Promise<ProductRatingData[]> {
  try {
    logger.info('Fetching product ratings batch', {
      correlationId,
      productCount: productIds.length,
    });

    if (productIds.length === 0) {
      return [];
    }

    if (productIds.length > 100) {
      throw new Error('Maximum 100 products per batch request');
    }

    const reviewData = await reviewClient.getReviewsBatch(productIds);

    // Map ReviewAggregate to ProductRatingData
    const ratings = reviewData.map((review) => ({
      productId: review.productId,
      averageRating: review.averageRating,
      totalReviews: review.totalReviews,
      ratingDistribution: review.ratingDistribution,
      verifiedReviewsCount: 0, // Default value
      qualityMetrics: {
        averageHelpfulScore: 0,
        totalHelpfulVotes: 0,
        reviewsWithMedia: 0,
        averageReviewLength: 0,
      },
      trends: {
        last30Days: { totalReviews: 0, averageRating: 0 },
        last7Days: { totalReviews: 0, averageRating: 0 },
      },
      lastUpdated: new Date().toISOString(),
    }));

    logger.info('Successfully fetched product ratings batch', {
      correlationId,
      requestedCount: productIds.length,
      returnedCount: ratings.length,
    });

    return ratings;
  } catch (error) {
    logger.error('Error fetching product ratings batch', {
      correlationId,
      productCount: productIds.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return default ratings for all products on error
    return productIds.map((productId) => ({
      productId,
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      verifiedReviewsCount: 0,
      qualityMetrics: {
        averageHelpfulScore: 0,
        totalHelpfulVotes: 0,
        reviewsWithMedia: 0,
        averageReviewLength: 0,
      },
      trends: {
        last30Days: { totalReviews: 0, averageRating: 0 },
        last7Days: { totalReviews: 0, averageRating: 0 },
      },
      lastUpdated: new Date().toISOString(),
    }));
  }
}

/**
 * Enhance products list with rating data
 * Efficiently fetches rating data for multiple products
 * Adds both ratingDetails object and backward-compatible average_rating/num_reviews fields
 *
 * @param products - Array of product data
 * @param correlationId - Correlation ID for request tracing
 * @returns Products enhanced with rating details
 */
export async function enhanceProductsWithRatings(
  products: ProductData[],
  correlationId: string
): Promise<
  (ProductData & {
    ratingDetails: ProductRatingData;
    average_rating: number;
    num_reviews: number;
  })[]
> {
  try {
    if (products.length === 0) {
      return [];
    }

    const productIds = products.map((p) => p.id);
    const ratings = await getProductRatingsBatch(productIds, correlationId);

    // Create a map for quick lookup
    const ratingMap = ratings.reduce(
      (acc, rating) => {
        acc[rating.productId] = rating;
        return acc;
      },
      {} as Record<string, ProductRatingData>
    );

    // Enhance products with rating data
    return products.map((product) => {
      const ratingDetails = ratingMap[product.id] || {
        productId: product.id,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedReviewsCount: 0,
        qualityMetrics: {
          averageHelpfulScore: 0,
          totalHelpfulVotes: 0,
          reviewsWithMedia: 0,
          averageReviewLength: 0,
        },
        trends: {
          last30Days: { totalReviews: 0, averageRating: 0 },
          last7Days: { totalReviews: 0, averageRating: 0 },
        },
        lastUpdated: new Date().toISOString(),
      };

      return {
        ...product,
        // Add rating data to the main product object for frontend compatibility
        average_rating: ratingDetails.averageRating,
        num_reviews: ratingDetails.totalReviews,
        ratingDetails, // Keep detailed rating data for advanced use cases
      };
    });
  } catch (error) {
    logger.error('Error enhancing products with ratings', {
      correlationId,
      productCount: products.length,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return products without enhanced rating data on error
    return products.map((product) => {
      const defaultRatingDetails = {
        productId: product.id,
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedReviewsCount: 0,
        qualityMetrics: {
          averageHelpfulScore: 0,
          totalHelpfulVotes: 0,
          reviewsWithMedia: 0,
          averageReviewLength: 0,
        },
        trends: {
          last30Days: { totalReviews: 0, averageRating: 0 },
          last7Days: { totalReviews: 0, averageRating: 0 },
        },
        lastUpdated: new Date().toISOString(),
      };

      return {
        ...product,
        // Add rating data to the main product object for frontend compatibility
        average_rating: defaultRatingDetails.averageRating,
        num_reviews: defaultRatingDetails.totalReviews,
        ratingDetails: defaultRatingDetails,
      };
    });
  }
}
