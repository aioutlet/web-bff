/**
 * Logging module exports
 * Provides centralized access to all logging functionality
 */

import Logger from './logger';

// Create and export the logger instance with proper configuration
const logger = new Logger();

export default logger;

// Also export the Logger class for advanced usage
export { Logger };

// Export schemas and utilities
export {
  LOG_LEVELS,
  DEFAULT_CONFIG,
  ENVIRONMENT_CONFIGS,
  validateLogEntry,
  createBaseLogEntry,
  type LoggerConfig,
  type StandardLogEntry,
  type ErrorInfo,
} from './schemas';

// Export formatters
export { createJsonFormat, createConsoleFormat } from './formatters';
