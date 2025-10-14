import { initializeTracing } from './observability/tracing/index';
import app from './app';
import config from '@config/index';
import logger from './observability/index';

// Initialize tracing
initializeTracing();

const server = app.listen(config.port, () => {
  logger.info(`🚀 Web BFF started`, {
    env: config.env,
    port: config.port,
    host: config.host,
  });

  logger.info('Service URLs:', config.services);
});

// Graceful shutdown
const shutdown = () => {
  logger.info('Shutting down gracefully...');

  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection', { reason, promise });
  shutdown();
});
