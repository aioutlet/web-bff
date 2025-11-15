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
 * Get trending data (products and categories combined)
 */
export const getTrendingData = asyncHandler(
  async (req: RequestWithTraceContext, res: Response) => {
    const { traceId, spanId } = req;
    const productsLimit = parseInt(req.query.productsLimit as string) || 4;
    const categoriesLimit = parseInt(req.query.categoriesLimit as string) || 5;

    logger.info('Fetching trending data', {
      traceId,
      spanId,
      productsLimit,
      categoriesLimit,
    });

    // Single call to product service via aggregator (which calls /trending)
    const trendingData = await storefrontAggregator.getTrendingData(
      productsLimit,
      categoriesLimit,
      traceId,
      spanId
    );

    res.json({
      success: true,
      data: trendingData,
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
