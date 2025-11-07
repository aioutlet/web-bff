import { Router, Response } from 'express';
import { storefrontAggregator } from '@aggregators/storefront.aggregator';
import logger from '../core/logger';
import { RequestWithCorrelationId } from '@middleware/correlation-id.middleware';

const router = Router();

/**
 * GET /api/home/trending
 * Get trending products with inventory and reviews
 */
router.get('/trending', async (req: RequestWithCorrelationId, res: Response) => {
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
});

/**
 * GET /api/home/trending-categories
 * Get trending categories with metadata
 */
router.get('/trending-categories', async (req: RequestWithCorrelationId, res: Response) => {
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
});

/**
 * GET /api/home/categories
 * Get product categories
 */
router.get('/categories', async (req: RequestWithCorrelationId, res: Response) => {
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
});

export default router;
