import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import app from './app';
import config from './core/config';
import logger from './core/logger';
import validateConfig from './validators/config.validator';

// Validate configuration
validateConfig();

const PORT = config.port;
const HOST = config.host;

app.listen(PORT, HOST, () => {
  logger.info(`Web BFF running on ${HOST}:${PORT} in ${config.env} mode`, {
    service: 'web-bff',
    version: '1.0.0',
    daprEnabled: config.dapr.enabled,
  });
});

const gracefulShutdown = (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
