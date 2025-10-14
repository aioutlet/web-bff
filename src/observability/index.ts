/**
 * Observability module exports
 * Centralized access to all observability functionality including logging and tracing
 */

// Logging exports
import logger from './logging/index';
export default logger;

export { Logger } from './logging/index';
export {
  LOG_LEVELS,
  DEFAULT_CONFIG,
  ENVIRONMENT_CONFIGS,
  validateLogEntry,
  createBaseLogEntry,
  type LoggerConfig,
  type StandardLogEntry,
  type ErrorInfo,
} from './logging/index';

// Tracing exports
export {
  initializeTracing,
  shutdownTracing,
  isTracingEnabled,
  getTracingContext,
  createOperationSpan,
} from './tracing/index';
