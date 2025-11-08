import { productClient, Product, TrendingCategory } from '@clients/product.client';
import { inventoryClient, InventoryItem } from '@clients/inventory.client';
import logger from '../core/logger';

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

export interface EnrichedCategory extends TrendingCategory {
  displayName: string;
  description: string;
  image: string;
  department: string;
  categoryName: string;
  accurateCount: number;
  path: string;
}

export class StorefrontAggregator {
  /**
   * Get trending products with inventory and review data
   * OPTIMIZED: Single call to product service /storefront-data endpoint
   * Reduces service calls from 3-4 to 2 (storefront data + inventory)
   */
  async getTrendingProducts(limit: number = 4, correlationId?: string): Promise<EnrichedProduct[]> {
    try {
      const cid = correlationId || `storefront-trending-${Date.now()}`;

      logger.info('Fetching storefront data (trending products)', {
        correlationId: cid,
        limit,
      });

      // Single call to product service for trending products
      // Product service calculates trending scores using MongoDB aggregation
      // Note: FastAPI requires minimum value of 1, so we pass 1 for categories_limit even though we only need products
      const { trending_products } = await productClient.getStorefrontData(limit, 1);

      if (!trending_products || trending_products.length === 0) {
        logger.warn('No trending products returned', { correlationId: cid });
        return [];
      }

      // Extract SKUs for inventory lookup
      const skus = trending_products.map((p) => p.sku).filter((sku): sku is string => Boolean(sku));

      // Fetch inventory data in parallel
      let inventoryMap = new Map<string, InventoryItem>();
      try {
        const inventoryData = await inventoryClient.getInventoryBatch(skus);
        inventoryData.forEach((item) => inventoryMap.set(item.sku, item));
      } catch (error) {
        logger.warn('Failed to fetch inventory data for trending products', {
          error,
          correlationId: cid,
        });
      }

      // Map to EnrichedProduct format
      const enrichedProducts: EnrichedProduct[] = trending_products.map((product) => {
        const inventory = product.sku ? inventoryMap.get(product.sku) : undefined;

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          category: product.category || '',
          sku: product.sku || '',
          images: product.images,
          isActive: product.isActive,
          inventory: {
            inStock: inventory ? inventory.quantityAvailable > 0 : false,
            availableQuantity: inventory?.quantityAvailable || 0,
          },
          reviews: {
            averageRating: (product as any).review_aggregates?.average_rating || 0,
            reviewCount: (product as any).review_aggregates?.total_review_count || 0,
          },
        };
      });

      logger.info('Trending products aggregation complete', {
        correlationId: cid,
        count: enrichedProducts.length,
      });

      return enrichedProducts;
    } catch (error) {
      logger.error('Error getting trending products', { error });
      throw error;
    }
  }

  /**
   * Get trending categories with enriched display data
   * OPTIMIZED: Single call to product service /storefront-data endpoint
   */
  async getTrendingCategories(limit: number = 5): Promise<EnrichedCategory[]> {
    try {
      logger.info('Fetching storefront data (trending categories)', { limit });

      // Single call to product service for trending categories
      // Note: FastAPI requires minimum value of 1, so we pass 1 for products_limit even though we only need categories
      const { trending_categories } = await productClient.getStorefrontData(1, limit);

      if (!trending_categories || trending_categories.length === 0) {
        logger.warn('No trending categories returned');
        return [];
      }

      // Enrich categories with display information
      const enrichedCategories = await Promise.all(
        trending_categories.map(async (category) => await this.enrichCategory(category))
      );

      logger.info('Trending categories aggregation complete', {
        count: enrichedCategories.length,
      });

      return enrichedCategories;
    } catch (error) {
      logger.error('Error getting trending categories', { error });
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
   * Enrich category with display metadata and accurate product count
   */
  private async enrichCategory(category: TrendingCategory): Promise<EnrichedCategory> {
    // Map category names to department, category, and path
    // Based on actual product database structure
    const categoryRoutes: Record<
      string,
      { department: string; categoryName: string; path: string }
    > = {
      Clothing: { department: 'Women', categoryName: 'Clothing', path: '/women/clothing' },
      Accessories: { department: 'Women', categoryName: 'Accessories', path: '/women/accessories' },
      Apparel: { department: 'Sports', categoryName: 'Apparel', path: '/sports/apparel' },
      Footwear: { department: 'Kids', categoryName: 'Footwear', path: '/kids/footwear' },
      Mobile: { department: 'Electronics', categoryName: 'Mobile', path: '/electronics/mobile' },
      Audio: { department: 'Electronics', categoryName: 'Audio', path: '/electronics/audio' },
      Computers: {
        department: 'Electronics',
        categoryName: 'Computers',
        path: '/electronics/computers',
      },
      Gaming: { department: 'Electronics', categoryName: 'Gaming', path: '/electronics/gaming' },
      Fiction: { department: 'Books', categoryName: 'Fiction', path: '/books/fiction' },
      Nonfiction: { department: 'Books', categoryName: 'Nonfiction', path: '/books/nonfiction' },
    };

    // Map category names to display names and images
    const categoryMetadata: Record<
      string,
      { displayName: string; description: string; image: string }
    > = {
      Electronics: {
        displayName: 'Tech essentials',
        description: 'Latest gadgets and devices',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800',
      },
      Audio: {
        displayName: 'Sound & music',
        description: 'Headphones and speakers',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      },
      Computers: {
        displayName: 'Computing',
        description: 'Laptops and desktops',
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      },
      Gaming: {
        displayName: 'Gaming',
        description: 'Consoles and accessories',
        image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800',
      },
      Wearables: {
        displayName: 'Wearables',
        description: 'Smartwatches and fitness',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      },
      Clothing: {
        displayName: 'Style & trends',
        description: 'Fashion and apparel',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800',
      },
      Footwear: {
        displayName: 'Footwear',
        description: 'Shoes and sneakers',
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      },
      Furniture: {
        displayName: 'For your space',
        description: 'Home and office furniture',
        image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800',
      },
      'Home Appliances': {
        displayName: 'Home essentials',
        description: 'Kitchen and cleaning',
        image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800',
      },
      Cameras: {
        displayName: 'Photography',
        description: 'Cameras and accessories',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800',
      },
      Tablets: {
        displayName: 'Tablets',
        description: 'iPads and tablets',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
      },
      Automotive: {
        displayName: 'Automotive',
        description: 'Car parts and accessories',
        image: 'https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=800',
      },
    };

    const metadata = categoryMetadata[category.name] || {
      displayName: category.name,
      description: `Browse ${category.name}`,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
    };

    // Get routing information for this category
    const route = categoryRoutes[category.name];

    // Use the product count already provided by the trending categories endpoint
    // This avoids making 5 additional API calls for product counts
    const accurateCount = category.product_count;

    return {
      ...category,
      ...metadata,
      department: route?.department || category.name,
      categoryName: route?.categoryName || category.name,
      accurateCount,
      path: route?.path || `/products?category=${category.name}`,
    };
  }
}

export const storefrontAggregator = new StorefrontAggregator();
