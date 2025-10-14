import { productClient, Product, TrendingCategory } from '@clients/product.client';
import { inventoryClient, InventoryItem } from '@clients/inventory.client';
import { reviewClient, ReviewAggregate } from '@clients/review.client';
import logger from '@observability';

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
   * Get trending categories with enriched display data
   */
  async getTrendingCategories(limit: number = 5): Promise<EnrichedCategory[]> {
    try {
      const categories = await productClient.getTrendingCategories(limit);

      if (!categories || categories.length === 0) {
        return [];
      }

      // Enrich categories with display information and accurate counts
      const enrichedCategories = await Promise.all(
        categories.map(async (category) => await this.enrichCategory(category))
      );

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

    // Fetch accurate product count for the specific department+category combination
    let accurateCount = category.product_count; // Fallback to original count
    if (route) {
      try {
        accurateCount = await productClient.getProductCount(route.department, route.categoryName);
      } catch (error) {
        logger.warn(
          `Failed to fetch accurate count for ${route.department}/${route.categoryName}`,
          {
            error,
          }
        );
      }
    }

    return {
      ...category,
      ...metadata,
      department: route?.department || category.name,
      categoryName: route?.categoryName || category.name,
      accurateCount,
      path: route?.path || `/products?category=${category.name}`,
    };
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
