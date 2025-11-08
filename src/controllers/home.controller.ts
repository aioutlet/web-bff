/**
 * Home Controller
 * Handles service information and storefront homepage endpoints
 */

import { Request, Response } from 'express';
import { storefrontAggregator } from '@aggregators/storefront.aggregator';
import logger from '../core/logger';
import { RequestWithCorrelationId } from '@middleware/correlation-id.middleware';

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
  req: RequestWithCorrelationId,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 4;

    logger.info('Fetching trending products', {
      correlationId: req.correlationId,
      limit,
    });

    const products = await storefrontAggregator.getTrendingProducts(limit, req.correlationId);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    logger.error('Error in /api/home/trending', {
      correlationId: req.correlationId,
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
  req: RequestWithCorrelationId,
  res: Response
): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    logger.info('Fetching trending categories', {
      correlationId: req.correlationId,
      limit,
    });

    const categories = await storefrontAggregator.getTrendingCategories(limit);

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error in /api/home/trending-categories', {
      correlationId: req.correlationId,
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
export const getCategories = async (
  req: RequestWithCorrelationId,
  res: Response
): Promise<void> => {
  try {
    logger.info('Fetching categories', {
      correlationId: req.correlationId,
    });

    const categories = await storefrontAggregator.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error('Error in /api/home/categories', {
      correlationId: req.correlationId,
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
