import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface Config {
  env: string;
  port: number;
  host: string;
  allowedOrigins: string[];
  dapr: {
    enabled: boolean;
    host: string;
    httpPort: string;
    grpcPort: string;
    pubsubName: string;
  };
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
  logging: {
    level: string;
    filePath: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3100', 10),
  host: process.env.HOST || '0.0.0.0',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  dapr: {
    enabled: process.env.DAPR_ENABLED === 'true',
    host: process.env.DAPR_HOST || '127.0.0.1',
    httpPort: process.env.DAPR_HTTP_PORT || '3600',
    grpcPort: process.env.DAPR_GRPC_PORT || '50060',
    pubsubName: process.env.DAPR_PUBSUB_NAME || 'rabbitmq-pubsub',
  },
  services: {
    product: process.env.PRODUCT_SERVICE_APP_ID || 'product-service',
    inventory: process.env.INVENTORY_SERVICE_APP_ID || 'inventory-service',
    review: process.env.REVIEW_SERVICE_APP_ID || 'review-service',
    auth: process.env.AUTH_SERVICE_APP_ID || 'auth-service',
    user: process.env.USER_SERVICE_APP_ID || 'user-service',
    cart: process.env.CART_SERVICE_APP_ID || 'cart-service',
    order: process.env.ORDER_SERVICE_APP_ID || 'order-service',
    admin: process.env.ADMIN_SERVICE_APP_ID || 'admin-service',
  },
  serviceConfig: {
    timeout: parseInt(process.env.SERVICE_TIMEOUT || '5000', 10),
    retryCount: parseInt(process.env.SERVICE_RETRY_COUNT || '3', 10),
    retryDelay: parseInt(process.env.SERVICE_RETRY_DELAY || '1000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || 'logs/web-bff.log',
  },
};

export default config;
