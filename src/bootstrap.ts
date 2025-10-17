import dotenv from 'dotenv';
dotenv.config({ quiet: true });

// Industry-standard initialization pattern for Web BFF:
// 1. Load environment variables
// 2. Validate configuration (blocking - must pass)
// 3. Check dependency health (non-blocking - log only)
// 4. Initialize observability modules (logger, tracing)
// 5. Start application

import validateConfig from './validators/config.validator';
import { checkDependencyHealth, getDependencies } from './utils/dependencyHealthChecker';

async function startServer() {
  try {
    // Configuration validation
    validateConfig();

    // Initialize observability
    const { initializeTracing } = await import('./observability/tracing/index');
    initializeTracing();

    // Check dependency health (non-blocking)
    const dependencies = getDependencies();
    if (Object.keys(dependencies).length > 0) {
      // Check all dependencies once
      checkDependencyHealth(dependencies, 5000).catch((error) =>
        console.log(`⚠️ Dependency health check failed: ${error.message}`)
      );
    } // Start application
    const { default: app } = await import('./app');
    const { default: config } = await import('./config/index');
    const logger = (await import('./observability/index')).default;

    const server = app.listen(config.port, () => {
      logger.info(`🚀 Web BFF started on http://${config.host}:${config.port}`);
      logger.info(`� Connected to ${Object.keys(dependencies).length} services`);
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
  } catch (error: any) {
    console.error('❌ Failed to start Web BFF:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

startServer();
