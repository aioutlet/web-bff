import axios from 'axios';
import logger from '@observability';

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8003';
const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || 'http://localhost:8004';

interface ProductData {
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
  average_rating: number;
  num_reviews: number;
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

interface AggregatedProduct extends ProductData {
  reviews: ReviewData[];
}

/**
 * Aggregates product data with reviews from review-service
 *
 * @param productId - The ID of the product to aggregate
 * @param correlationId - Correlation ID for request tracing
 * @param limit - Maximum number of reviews to fetch (default: 5 for product detail page)
 * @returns Aggregated product with reviews
 */
export async function aggregateProductWithReviews(
  productId: string,
  correlationId: string,
  limit: number = 5
): Promise<AggregatedProduct> {
  try {
    logger.info('Aggregating product with reviews', {
      correlationId,
      productId,
      reviewLimit: limit,
    });

    // Fetch product and reviews in parallel
    const [productResponse, reviewsResponse] = await Promise.allSettled([
      axios.get(`${PRODUCT_SERVICE_URL}/api/products/${productId}`, {
        headers: { 'X-Correlation-Id': correlationId },
        timeout: 5000,
      }),
      axios.get(`${REVIEW_SERVICE_URL}/api/reviews/product/${productId}`, {
        params: {
          status: 'approved',
          limit,
          sort: 'helpful', // Sort by most helpful reviews
        },
        headers: { 'X-Correlation-Id': correlationId },
        timeout: 5000,
      }),
    ]);

    // Handle product response
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

    // Combine product and reviews
    const aggregatedProduct: AggregatedProduct = {
      ...product,
      reviews,
    };

    logger.info('Product aggregation successful', {
      correlationId,
      productId,
      reviewCount: reviews.length,
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

    const response = await axios.get(`${REVIEW_SERVICE_URL}/api/reviews/product/${productId}`, {
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
