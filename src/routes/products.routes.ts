import { Router, Response } from 'express';
import axios from 'axios';
import logger from '@utils/logger';
import { RequestWithCorrelationId } from '@middleware/correlation-id.middleware';

const router = Router();

const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:8003';

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
    const params = new URLSearchParams();
    if (department) params.append('department', department as string);
    if (category) params.append('category', category as string);
    if (subcategory) params.append('subcategory', subcategory as string);
    if (min_price) params.append('min_price', min_price as string);
    if (max_price) params.append('max_price', max_price as string);
    if (tags) {
      // Handle array of tags
      const tagArray = Array.isArray(tags) ? tags : [tags];
      tagArray.forEach((tag) => params.append('tags', tag as string));
    }
    params.append('skip', skip as string);
    params.append('limit', limit as string);

    // Call product-service
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/?${params.toString()}`, {
      headers: {
        'X-Correlation-Id': req.correlationId,
      },
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    logger.error('Error in /api/products', {
      correlationId: req.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const status =
      axios.isAxiosError(error) && error.response?.status ? error.response.status : 500;

    res.status(status).json({
      success: false,
      error: {
        message: 'Failed to fetch products',
        details: axios.isAxiosError(error) ? error.response?.data : undefined,
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
    const params = new URLSearchParams();
    params.append('q', q as string);
    if (department) params.append('department', department as string);
    if (category) params.append('category', category as string);
    if (subcategory) params.append('subcategory', subcategory as string);
    if (min_price) params.append('min_price', min_price as string);
    if (max_price) params.append('max_price', max_price as string);
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      tagArray.forEach((tag) => params.append('tags', tag as string));
    }
    params.append('skip', skip as string);
    params.append('limit', limit as string);

    // Call product-service
    const response = await axios.get(
      `${PRODUCT_SERVICE_URL}/api/products/search?${params.toString()}`,
      {
        headers: {
          'X-Correlation-Id': req.correlationId,
        },
        timeout: 5000,
      }
    );

    return res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    logger.error('Error in /api/products/search', {
      correlationId: req.correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const status =
      axios.isAxiosError(error) && error.response?.status ? error.response.status : 500;

    return res.status(status).json({
      success: false,
      error: {
        message: 'Failed to search products',
        details: axios.isAxiosError(error) ? error.response?.data : undefined,
      },
    });
  }
});

/**
 * GET /api/products/:id
 * Get a single product by ID
 */
router.get('/:id', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { id } = req.params;

    logger.info('Fetching product by ID', {
      correlationId: req.correlationId,
      productId: id,
    });

    // Call product-service
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${id}`, {
      headers: {
        'X-Correlation-Id': req.correlationId,
      },
      timeout: 5000,
    });

    res.json({
      success: true,
      data: response.data,
    });
  } catch (error) {
    logger.error('Error in /api/products/:id', {
      correlationId: req.correlationId,
      productId: req.params.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const status =
      axios.isAxiosError(error) && error.response?.status ? error.response.status : 500;

    res.status(status).json({
      success: false,
      error: {
        message: 'Failed to fetch product',
        details: axios.isAxiosError(error) ? error.response?.data : undefined,
      },
    });
  }
});

export default router;
