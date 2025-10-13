import { productClient, Product } from '@clients/product.client';
import { inventoryClient, InventoryItem } from '@clients/inventory.client';
import { reviewClient, ReviewAggregate } from '@clients/review.client';
import logger from '@utils/logger';

export interface EnrichedProduct extends Product {
  inventory: {
    inStock: boolean;
    availableQuantity: number;
  };
  reviews: {
    averageRating: number;
    reviewCount: number;
  };
}

export class HomeAggregator {
  /**
   * Get trending products with inventory and review data
   */
  async getTrendingProducts(limit: number = 4): Promise<EnrichedProduct[]> {
    try {
      // Step 1: Fetch trending products
      const products = await productClient.getTrendingProducts(limit);

      if (!products || products.length === 0) {
        return [];
      }

      // Step 2: Enrich with inventory and reviews
      return await this.enrichProducts(products);
    } catch (error) {
      logger.error('Error getting trending products', { error });
      throw error;
    }
  }

  /**
   * Get categories with product counts
   */
  async getCategories(): Promise<string[]> {
    try {
      return await productClient.getCategories();
    } catch (error) {
      logger.error('Error getting categories', { error });
      throw error;
    }
  }

  /**
   * Enrich products with inventory and review data
   */
  private async enrichProducts(products: Product[]): Promise<EnrichedProduct[]> {
    const skus = products.map((p) => p.sku).filter(Boolean);
    const productIds = products.map((p) => p.id);

    // Parallel fetch from inventory and review services
    const [inventoryData, reviewData] = await Promise.allSettled([
      inventoryClient.getInventoryBatch(skus),
      reviewClient.getReviewsBatch(productIds),
    ]);

    // Create lookup maps
    const inventoryMap = new Map<string, InventoryItem>();
    if (inventoryData.status === 'fulfilled') {
      inventoryData.value.forEach((item) => inventoryMap.set(item.sku, item));
    } else {
      logger.warn('Failed to fetch inventory data', { error: inventoryData.reason });
    }

    const reviewMap = new Map<string, ReviewAggregate>();
    if (reviewData.status === 'fulfilled') {
      reviewData.value.forEach((review) => reviewMap.set(review.productId, review));
    } else {
      logger.warn('Failed to fetch review data', { error: reviewData.reason });
    }

    // Combine all data
    return products.map((product) => {
      const inventory = inventoryMap.get(product.sku);
      const reviews = reviewMap.get(product.id);

      return {
        ...product,
        inventory: {
          inStock: inventory ? inventory.quantityAvailable > 0 : false,
          availableQuantity: inventory?.quantityAvailable || 0,
        },
        reviews: {
          averageRating: reviews?.averageRating || 0,
          reviewCount: reviews?.totalReviews || 0,
        },
      };
    });
  }
}

export const homeAggregator = new HomeAggregator();
