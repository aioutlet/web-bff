import { Router, Request, Response } from 'express';
import { inventoryClient } from '../clients/inventory.client';
import logger from '../core/logger';

const router = Router();

/**
 * Get inventory batch
 * POST /api/inventory/batch
 */
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const { skus } = req.body;

    if (!Array.isArray(skus) || skus.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'SKUs array is required',
      });
    }

    logger.info(`[Inventory] Fetching batch inventory for ${skus.length} SKUs`, {
      skus,
      correlationId: req.headers['x-correlation-id'],
    });

    const inventoryData = await inventoryClient.getInventoryBatch(skus);

    logger.info(`[Inventory] Received ${inventoryData.length} inventory items`, {
      correlationId: req.headers['x-correlation-id'],
    });

    res.json({
      success: true,
      data: inventoryData,
    });
  } catch (error: any) {
    logger.error('[Inventory] Error fetching batch inventory', {
      error: error.message,
      stack: error.stack,
      correlationId: req.headers['x-correlation-id'],
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
    });
  }
});

/**
 * Get inventory for single SKU
 * GET /api/inventory/:sku
 */
router.get('/:sku', async (req: Request, res: Response) => {
  try {
    const { sku } = req.params;

    logger.info(`[Inventory] Fetching inventory for SKU: ${sku}`, {
      correlationId: req.headers['x-correlation-id'],
    });

    const inventory = await inventoryClient.getInventory(sku);

    res.json({
      success: true,
      data: inventory,
    });
  } catch (error: any) {
    logger.error('[Inventory] Error fetching inventory', {
      error: error.message,
      sku: req.params.sku,
      correlationId: req.headers['x-correlation-id'],
    });

    res.status(500).json({
      success: false,
      error: 'Failed to fetch inventory',
    });
  }
});

export default router;
