/**
 * Products Controller for Web BFF
 * Handles all product-related operations including listing, search, and reviews
 */

import { Response } from 'express';
import { asyncHandler } from '@middleware/asyncHandler.middleware';
import { productClient } from '@clients/product.client';
import { inventoryClient } from '@clients/inventory.client';
import logger from '../core/logger';
import { RequestWithTraceContext } from '@middleware/traceContext.middleware';
import { getProductReviews } from '@aggregators/product.aggregator';

// Product type for type safety
interface Product {
  sku?: string;
  inventory?: {
    inStock: boolean;
    availableQuantity: number;
    status: string;
  };
  [key: string]: unknown;
}

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

  // Enrich products with inventory data
  const products = response.products || [];
  logger.info('Enriching products with inventory data', {
    traceId,
    spanId,
    productCount: products.length,
  });

  if (products.length > 0) {
    try {
      // Extract SKUs from products
      const skus = products
        .map((p: Product) => p.sku)
        .filter((sku: string | undefined): sku is string => !!sku);

      logger.info('Fetching inventory for SKUs', {
        traceId,
        spanId,
        skuCount: skus.length,
        skus: skus.slice(0, 5), // Log first 5 SKUs for debugging
      });

      if (skus.length > 0) {
        // Fetch inventory data in batch
        const inventoryData = await inventoryClient.getInventoryBatch(skus);

        logger.info('Received inventory data', {
          traceId,
          spanId,
          inventoryItemCount: inventoryData.length,
        });

        // Create a map for quick lookup
        const inventoryMap = new Map(inventoryData.map((item) => [item.sku, item]));

        // Enrich each product with inventory data
        products.forEach((product: Product) => {
          const inventory = inventoryMap.get(product.sku);
          if (inventory) {
            product.inventory = {
              inStock: inventory.quantityAvailable > 0,
              availableQuantity: inventory.quantityAvailable,
              status: inventory.status,
            };
          } else {
            // Product not in inventory - mark as out of stock
            product.inventory = {
              inStock: false,
              availableQuantity: 0,
              status: 'out_of_stock',
            };
          }
        });
      }
    } catch (error) {
      logger.error('Failed to enrich products with inventory data', {
        traceId,
        spanId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Continue without inventory data - don't fail the request
    }
  } else {
    logger.info('No products to enrich with inventory', { traceId, spanId });
  }

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

  // Enrich products with inventory data
  const products = response.products || [];
  logger.info('Enriching search results with inventory data', {
    traceId,
    spanId,
    productCount: products.length,
  });

  if (products.length > 0) {
    try {
      const skus = products
        .map((p: Product) => p.sku)
        .filter((sku: string | undefined): sku is string => !!sku);

      logger.info('Fetching inventory for search SKUs', {
        traceId,
        spanId,
        skuCount: skus.length,
        skus: skus.slice(0, 5),
      });

      if (skus.length > 0) {
        const inventoryData = await inventoryClient.getInventoryBatch(skus);

        logger.info('Received inventory data for search', {
          traceId,
          spanId,
          inventoryItemCount: inventoryData.length,
        });
        const inventoryMap = new Map(inventoryData.map((item) => [item.sku, item]));

        products.forEach((product: Product) => {
          const inventory = inventoryMap.get(product.sku);
          if (inventory) {
            product.inventory = {
              inStock: inventory.quantityAvailable > 0,
              availableQuantity: inventory.quantityAvailable,
              status: inventory.status,
            };
          } else {
            product.inventory = {
              inStock: false,
              availableQuantity: 0,
              status: 'out_of_stock',
            };
          }
        });
      }
    } catch (error) {
      logger.error('Failed to enrich search results with inventory data', {
        traceId,
        spanId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  } else {
    logger.info('No search results to enrich', { traceId, spanId });
  }

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

  // Enrich with inventory data
  if (product && product.sku) {
    logger.info('Fetching inventory for product detail', {
      traceId,
      spanId,
      productId: id,
      sku: product.sku,
    });

    try {
      const inventoryData = await inventoryClient.getInventoryBatch([product.sku]);

      logger.info('Received inventory for product detail', {
        traceId,
        spanId,
        productId: id,
        hasInventory: inventoryData.length > 0,
      });
      if (inventoryData.length > 0) {
        const inventory = inventoryData[0];
        product.inventory = {
          inStock: inventory.quantityAvailable > 0,
          availableQuantity: inventory.quantityAvailable,
          status: inventory.status,
        };
      } else {
        product.inventory = {
          inStock: false,
          availableQuantity: 0,
          status: 'out_of_stock',
        };
      }
    } catch (error) {
      logger.error('Failed to enrich product detail with inventory data', {
        traceId,
        spanId,
        productId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      // Continue without inventory data
    }
  } else {
    logger.info('Product has no SKU, skipping inventory enrichment', {
      traceId,
      spanId,
      productId: id,
      hasSku: !!(product && product.sku),
    });
  }

  res.json({
    success: true,
    data: product,
  });
});

/**
 * GET /api/products/:id/reviews
 * Get all reviews for a product with pagination
 */
export const getProductReviewsById = asyncHandler(
  async (req: RequestWithTraceContext, res: Response) => {
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
  }
);

/**
 * GET /api/products/categories
 * Get all product categories
 * Direct call to product service - no aggregation needed
 */
export const getCategories = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;

  logger.info('Fetching all product categories', {
    traceId,
    spanId,
  });

  // Direct call to product service
  const categories = await productClient.getCategories();

  res.json({
    success: true,
    data: categories,
  });
});
