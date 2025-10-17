import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  env: string;
  port: number;
  host: string;
  allowedOrigins: string[];
  services: {
    product: string;
    inventory: string;
    review: string;
    auth: string;
    user: string;
    cart: string;
    order: string;
    admin: string;
  };
  serviceConfig: {
    timeout: number;
    retryCount: number;
    retryDelay: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  cache: {
    ttl: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  logging: {
    level: string;
    filePath: string;
  };
  circuitBreaker: {
    threshold: number;
    timeout: number;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3100', 10),
  host: process.env.HOST || 'localhost',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  services: {
    product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:8000',
    inventory: process.env.INVENTORY_SERVICE_URL || 'http://localhost:5000',
    review: process.env.REVIEW_SERVICE_URL || 'http://localhost:9001',
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    cart: process.env.CART_SERVICE_URL || 'http://localhost:8006',
    order: process.env.ORDER_SERVICE_URL || 'http://localhost:5001',
    admin: process.env.ADMIN_SERVICE_URL || 'http://localhost:3010',
  },
  serviceConfig: {
    timeout: parseInt(process.env.SERVICE_TIMEOUT || '5000', 10),
    retryCount: parseInt(process.env.SERVICE_RETRY_COUNT || '3', 10),
    retryDelay: parseInt(process.env.SERVICE_RETRY_DELAY || '1000', 10),
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '300', 10),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/web-bff.log',
  },
  circuitBreaker: {
    threshold: parseInt(process.env.CIRCUIT_BREAKER_THRESHOLD || '5', 10),
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT || '60000', 10),
  },
};

export default config;
