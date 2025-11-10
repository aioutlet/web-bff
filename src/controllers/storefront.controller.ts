/**
 * Storefront Controller
 * Handles storefront homepage endpoints (trending products, categories, etc.)
 */

import { Response } from 'express';
import { storefrontAggregator } from '@aggregators/storefront.aggregator';
import logger from '../core/logger';
import { RequestWithTraceContext } from '@middleware/traceContext.middleware';
import { asyncHandler } from '@middleware/asyncHandler.middleware';

/**
 * Get trending products with inventory and reviews
 */
export const getTrendingProducts = asyncHandler(
  async (req: RequestWithTraceContext, res: Response) => {
    const { traceId, spanId } = req;
    const limit = parseInt(req.query.limit as string) || 4;

    logger.info('Fetching trending products', {
      traceId,
      spanId,
      limit,
    });

    const products = await storefrontAggregator.getTrendingProducts(limit, traceId, spanId);

    res.json({
      success: true,
      data: products,
    });
  }
);

/**
 * Get trending categories with metadata
 */
export const getTrendingCategories = asyncHandler(
  async (req: RequestWithTraceContext, res: Response) => {
    const { traceId, spanId } = req;
    const limit = parseInt(req.query.limit as string) || 5;

    logger.info('Fetching trending categories', {
      traceId,
      spanId,
      limit,
    });

    const categories = await storefrontAggregator.getTrendingCategories(limit);

    res.json({
      success: true,
      data: categories,
    });
  }
);

/**
 * Get product categories
 */
export const getCategories = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  logger.info('Fetching categories', {
    traceId,
    spanId,
  });

  const categories = await storefrontAggregator.getCategories();

  res.json({
    success: true,
    data: categories,
  });
});
