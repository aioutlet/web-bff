import { Router, Response } from 'express';
import { productClient } from '@clients/product.client';
import logger from '../core/logger';
import { RequestWithCorrelationId } from '@middleware/correlation-id.middleware';
import {
  aggregateProductWithReviews,
  getProductReviews,
  enhanceProductsWithRatings,
} from '@aggregators/product.aggregator';

const router = Router();

/**
 * GET /api/products
 * List products with hierarchical filtering
 * Supports: department, category, subcategory, price, tags, pagination
 */
router.get('/', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const {
      department,
      category,
      subcategory,
      min_price,
      max_price,
      tags,
      skip = '0',
      limit = '20',
    } = req.query;

    logger.info('Fetching products', {
      correlationId: req.correlationId,
      department,
      category,
      subcategory,
      skip,
      limit,
    });

    // Build query parameters
    const params: Record<string, string> = {};
    if (department) params.department = department as string;
    if (category) params.category = category as string;
    if (subcategory) params.subcategory = subcategory as string;
    if (min_price) params.min_price = min_price as string;
    if (max_price) params.max_price = max_price as string;
    if (tags) {
      // Handle array of tags
      const tagArray = Array.isArray(tags) ? tags : [tags];
      params.tags = tagArray.join(',');
    }
    params.skip = skip as string;
    params.limit = limit as string;

    // Call product-service using Dapr client
    const response = await productClient.getProducts(params, {
      'X-Correlation-Id': req.correlationId || 'no-correlation',
    });

    // Enhance products with rating data from review service
    const products = response.products || [];
    const enhancedProducts = await enhanceProductsWithRatings(
      products,
      req.correlationId || 'no-correlation'
    );

    res.json({
      success: true,
      data: {
        ...response,
        products: enhancedProducts,
      },
    });
  } catch (error) {
    logger.error('Error in /api/products', {
      correlationId: req.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const status = error instanceof Error ? 500 : 500;

    res.status(status).json({
      success: false,
      error: {
        message: 'Failed to fetch products',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/products/search
 * Search products with hierarchical filtering
 */
router.get('/search', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const {
      q,
      department,
      category,
      subcategory,
      min_price,
      max_price,
      tags,
      skip = '0',
      limit = '20',
    } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Search query (q) is required',
        },
      });
    }

    logger.info('Searching products', {
      correlationId: req.correlationId,
      query: q,
      department,
      category,
      subcategory,
    });

    // Build query parameters
    const params: Record<string, string> = { q: q as string };
    if (department) params.department = department as string;
    if (category) params.category = category as string;
    if (subcategory) params.subcategory = subcategory as string;
    if (min_price) params.min_price = min_price as string;
    if (max_price) params.max_price = max_price as string;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      params.tags = tagArray.join(',');
    }
    params.skip = skip as string;
    params.limit = limit as string;

    // Call product-service using Dapr client
    const response = await productClient.searchProducts(params, {
      'X-Correlation-Id': req.correlationId || 'no-correlation',
    });

    // Enhance products with rating data from review service
    const products = response.products || [];
    const enhancedProducts = await enhanceProductsWithRatings(
      products,
      req.correlationId || 'no-correlation'
    );

    return res.json({
      success: true,
      data: {
        ...response,
        products: enhancedProducts,
      },
    });
  } catch (error) {
    logger.error('Error in /api/products/search', {
      correlationId: req.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const status = error instanceof Error ? 500 : 500;

    return res.status(status).json({
      success: false,
      error: {
        message: 'Failed to search products',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID with top reviews
 */
router.get('/:id', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { id } = req.params;
    const { reviewLimit = '5' } = req.query;

    logger.info('Fetching product by ID with reviews', {
      correlationId: req.correlationId,
      productId: id,
      reviewLimit,
    });

    // Aggregate product with top reviews
    const product = await aggregateProductWithReviews(
      id,
      req.correlationId || 'no-correlation',
      parseInt(reviewLimit as string, 10)
    );

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    logger.error('Error in /api/products/:id', {
      correlationId: req.correlationId,
      productId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const status = error instanceof Error ? 500 : 500;

    res.status(status).json({
      success: false,
      error: {
        message: 'Failed to fetch product',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
});

/**
 * GET /api/products/:id/reviews
 * Get all reviews for a product with pagination
 */
router.get('/:id/reviews', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { id } = req.params;
    const { skip = '0', limit = '20', sort = 'recent' } = req.query;

    logger.info('Fetching product reviews', {
      correlationId: req.correlationId,
      productId: id,
      skip,
      limit,
      sort,
    });

    // Fetch reviews for product
    const reviewData = await getProductReviews(
      id,
      req.correlationId || 'no-correlation',
      parseInt(skip as string, 10),
      parseInt(limit as string, 10),
      sort as string
    );

    res.json({
      success: true,
      data: reviewData,
    });
  } catch (error) {
    logger.error('Error in /api/products/:id/reviews', {
      correlationId: req.correlationId,
      productId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const status = error instanceof Error ? 500 : 500;

    res.status(status).json({
      success: false,
      error: {
        message: 'Failed to fetch product reviews',
        details: error instanceof Error ? error.message : undefined,
      },
    });
  }
});

export default router;
