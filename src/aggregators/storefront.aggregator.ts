import { productClient, Product, TrendingCategory } from '@clients/product.client';
import { inventoryClient, InventoryItem } from '@clients/inventory.client';
import { enhanceProductsWithRatings, ProductData, ProductRatingData } from './product.aggregator';
import logger from '@observability';
import axios from 'axios';
import config from '@config/index';

const PRODUCT_SERVICE_URL = config.services.product;

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
   * Uses full trending algorithm with review-based scoring
   */
  async getTrendingProducts(limit: number = 4, correlationId?: string): Promise<EnrichedProduct[]> {
    try {
      const cid = correlationId || `storefront-trending-${Date.now()}`;

      // Get trending products with review scoring
      const trendingProducts = await this.calculateTrendingProducts(cid, limit);

      if (!trendingProducts || trendingProducts.length === 0) {
        return [];
      }

      // Convert to EnrichedProduct format and add inventory data
      const skus = trendingProducts.map((p) => p.sku).filter((sku): sku is string => Boolean(sku));

      // Fetch inventory data
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
      const enrichedProducts: EnrichedProduct[] = trendingProducts.map((product) => {
        const inventory = product.sku ? inventoryMap.get(product.sku) : undefined;

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price,
          category: product.category || '',
          sku: product.sku || '',
          images: product.images,
          isActive: product.is_active,
          inventory: {
            inStock: inventory ? inventory.quantityAvailable > 0 : false,
            availableQuantity: inventory?.quantityAvailable || 0,
          },
          reviews: {
            averageRating: product.ratingDetails.averageRating,
            reviewCount: product.ratingDetails.totalReviews,
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
   * Calculate trending products with review-based scoring
   * Implements Amazon-style trending algorithm:
   * - Base score: average_rating × num_reviews
   * - Recency boost: Products created in last 30 days get 1.5x multiplier
   * - Minimum threshold: At least 3 reviews required
   */
  private async calculateTrendingProducts(
    correlationId: string,
    limit: number = 4
  ): Promise<(ProductData & { ratingDetails: ProductRatingData; trendingScore: number })[]> {
    logger.info('Calculating trending products with review data', {
      correlationId,
      limit,
    });

    // Step 1: Get more products than needed from Product Service (recently created)
    // We'll fetch 3x the limit to have enough candidates after filtering
    const candidateLimit = limit * 3;
    const response = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/trending`, {
      params: { limit: candidateLimit },
      headers: { 'X-Correlation-Id': correlationId },
      timeout: 5000,
    });

    const products: ProductData[] = response.data || [];

    if (products.length === 0) {
      logger.warn('No products returned from product service', { correlationId });
      return [];
    }

    logger.info('Fetched candidate products', {
      correlationId,
      candidateCount: products.length,
    });

    // Step 2: Enhance with review data
    const productsWithRatings = await enhanceProductsWithRatings(products, correlationId);

    // Step 3: Filter products with at least 3 reviews
    let qualifiedProducts = productsWithRatings.filter((p) => p.ratingDetails.totalReviews >= 3);

    // Fallback: If not enough products with 3+ reviews, use products with any reviews
    if (qualifiedProducts.length < limit) {
      logger.info('Not enough products with 3+ reviews, using products with any reviews', {
        correlationId,
        productsWithMinReviews: qualifiedProducts.length,
      });

      qualifiedProducts = productsWithRatings
        .filter((p) => p.ratingDetails.totalReviews > 0)
        .slice(0, candidateLimit);
    }

    // Final fallback: If still not enough, use all products
    if (qualifiedProducts.length < limit) {
      logger.info('Not enough products with reviews, using all available products', {
        correlationId,
      });
      qualifiedProducts = productsWithRatings;
    }

    logger.info('Qualified products after review filter', {
      correlationId,
      qualifiedCount: qualifiedProducts.length,
      filteredOut: products.length - qualifiedProducts.length,
    });

    // Step 4: Calculate trending score for each product
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const productsWithScores = qualifiedProducts.map((product) => {
      // Base trending score: rating × reviews
      const baseScore = product.ratingDetails.averageRating * product.ratingDetails.totalReviews;

      // Check if product is recent (created in last 30 days)
      const createdAt = new Date(product.created_at);
      const isRecent = createdAt >= thirtyDaysAgo;

      // Apply recency boost: 50% bonus for recent products
      const trendingScore = isRecent ? baseScore * 1.5 : baseScore;

      return {
        ...product,
        trendingScore,
        isRecent, // For debugging/logging
      };
    });

    // Step 5: Sort by trending score (highest first) and limit results
    const trendingProducts = productsWithScores
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    logger.info('Trending products calculation complete', {
      correlationId,
      returnedCount: trendingProducts.length,
      topScore: trendingProducts[0]?.trendingScore || 0,
      recentProductCount: trendingProducts.filter((p) => p.isRecent).length,
    });

    return trendingProducts;
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
