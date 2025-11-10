/**
 * Products Controller for Web BFF
 * Handles all product-related operations including listing, search, and reviews
 */

import { Response } from 'express';
import { asyncHandler } from '@middleware/asyncHandler.middleware';
import { productClient } from '@clients/product.client';
import logger from '../core/logger';
import { RequestWithTraceContext } from '@middleware/traceContext.middleware';
import { getProductReviews } from '@aggregators/product.aggregator';

/**
 * GET /api/products
 * List products with hierarchical filtering
 * Supports: department, category, subcategory, price, tags, pagination
 */
export const getProducts = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
const { traceId, spanId } = req;
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
  traceId,
  spanId,
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
// Products already include review_aggregates
const response = await productClient.getProducts(params, {
  'X-Correlation-Id': req.correlationId || 'no-correlation',
});

res.json({
  success: true,
  data: response,
});
});

/**
 * GET /api/products/search
 * Search products with hierarchical filtering
 */
export const searchProducts = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
const { traceId, spanId } = req;
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
  traceId,
  spanId,
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

// Products already include review_aggregates
return res.json({
  success: true,
  data: response,
});
});

/**
 * GET /api/products/:id
 * Get a single product by ID with top reviews
 */
export const getProductById = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
const { traceId, spanId } = req;
const { id } = req.params;
logger.info('Fetching product by ID', {
  traceId,
  spanId,
  productId: id,
});

// Product already includes review_aggregates from product service
const product = await productClient.getProductDetailsById(id, {
  'X-Correlation-Id': req.correlationId || 'no-correlation',
});

res.json({
  success: true,
  data: product,
});
});

/**
 * GET /api/products/:id/reviews
 * Get all reviews for a product with pagination
 */
export const getProductReviewsById = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
const { traceId, spanId } = req;
const { id } = req.params;
const { skip = '0', limit = '20', sort = 'recent' } = req.query;

logger.info('Fetching product reviews', {
  traceId,
  spanId,
  productId: id,
  skip,
  limit,
  sort,
});

// Fetch reviews for product
const reviewData = await getProductReviews(
  id,
  traceId,
  spanId,
  parseInt(skip as string, 10),
  parseInt(limit as string, 10),
  sort as string
);

res.json({
  success: true,
  data: reviewData,
});
});
