/**
 * Home Controller
 * Handles service information and storefront homepage endpoints
 */

import { Request, Response } from 'express';
import { storefrontAggregator } from '@aggregators/storefront.aggregator';
import logger from '../core/logger';
import { RequestWithTraceContext } from '@middleware/traceContext.middleware';

/**
 * Service information endpoint
 */
export const info = (_req: Request, res: Response): void => {
  res.json({
    message: 'Welcome to the Web BFF Service',
    service: 'web-bff',
    description: 'Backend for Frontend aggregation service for AIOutlet platform',
    environment: process.env.NODE_ENV || 'development',
  });
};

/**
 * Service version endpoint
 */
export const version = (_req: Request, res: Response): void => {
  res.json({
    service: 'web-bff',
    version: process.env.VERSION || '1.0.0',
  });
};

/**
 * Get trending products with inventory and reviews
 */
export const getTrendingProducts = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
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
  } catch (error) {
    const { traceId, spanId } = req;
    logger.error('Error in /api/home/trending', {
      traceId,
      spanId,
      error,
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch trending products',
      },
    });
  }
};

/**
 * Get trending categories with metadata
 */
export const getTrendingCategories = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
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
  } catch (error) {
    const { traceId, spanId } = req;
    logger.error('Error in /api/home/trending-categories', {
      traceId,
      spanId,
      error,
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch trending categories',
      },
    });
  }
};

/**
 * Get product categories
 */
export const getCategories = async (req: RequestWithTraceContext, res: Response): Promise<void> => {
  try {
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
  } catch (error) {
    const { traceId, spanId } = req;
    logger.error('Error in /api/home/categories', {
      traceId,
      spanId,
      error,
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to fetch categories',
      },
    });
  }
};
