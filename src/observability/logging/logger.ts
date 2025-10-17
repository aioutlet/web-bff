import winston from 'winston';
import {
  LOG_LEVELS,
  DEFAULT_CONFIG,
  ENVIRONMENT_CONFIGS,
  validateLogEntry,
  LoggerConfig,
} from './schemas';
import { createJsonFormat, createConsoleFormat } from './formatters';
import { getTracingContext } from '../tracing/helpers';

/**
 * Logger class implementing the unified logging schema
 */
class Logger {
  private config: LoggerConfig;
  private winston!: winston.Logger;

  constructor(config: Partial<LoggerConfig> = {}) {
    // Get environment-specific config
    const environment = process.env.NODE_ENV || 'development';
    const envConfig = ENVIRONMENT_CONFIGS[environment] || ENVIRONMENT_CONFIGS.development;

    // Get service name early for path calculation
    const serviceName =
      process.env.SERVICE_NAME || config.serviceName || envConfig.serviceName || 'web-bff';

    // Merge configurations: env vars > passed config > env defaults > global defaults
    // All values are overridden by environment variables
    this.config = {
      ...DEFAULT_CONFIG,
      ...envConfig,
      ...config,
      // Override with environment variables
      serviceName: serviceName,
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: environment,
      logLevel: (process.env.LOG_LEVEL ||
        config.logLevel ||
        envConfig.logLevel) as LoggerConfig['logLevel'],
      format: (process.env.LOG_FORMAT ||
        config.format ||
        envConfig.format) as LoggerConfig['format'],
      enableConsole: process.env.LOG_TO_CONSOLE === 'true',
      enableFile: process.env.LOG_TO_FILE === 'true',
      enableTracing: process.env.ENABLE_TRACING === 'true',
      filePath: process.env.LOG_FILE_PATH || config.filePath || `./logs/${serviceName}.log`,
    };

    // Force disable console and file logging in test environment
    if (environment === 'test') {
      this.config.enableConsole = false;
      this.config.enableFile = false;
    }

    // Initialize Winston logger
    this._initializeWinston();
  }

  /**
   * Initialize Winston logger with unified schema formatting
   */
  private _initializeWinston(): void {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.enableConsole && this.config.environment !== 'test') {
      transports.push(
        new winston.transports.Console({
          format:
            this.config.format === 'json'
              ? createJsonFormat(this.config)
              : createConsoleFormat(this.config),
          level: this.config.logLevel.toLowerCase(),
          stderrLevels: ['error'],
        })
      );
    }

    // File transport
    if (this.config.enableFile) {
      transports.push(
        new winston.transports.File({
          filename: this.config.filePath!,
          format: createJsonFormat(this.config),
          level: this.config.logLevel.toLowerCase(),
        })
      );
    }

    // Exception and rejection handlers
    const exceptionHandlers: winston.transport[] = [];
    const rejectionHandlers: winston.transport[] = [];

    if (this.config.enableFile && this.config.filePath) {
      exceptionHandlers.push(
        new winston.transports.File({
          filename: this.config.filePath.replace('.log', '-exceptions.log'),
        })
      );
      rejectionHandlers.push(
        new winston.transports.File({
          filename: this.config.filePath.replace('.log', '-rejections.log'),
        })
      );
    }

    if (this.config.enableConsole && this.config.environment !== 'test') {
      exceptionHandlers.push(
        new winston.transports.Console({
          format: createConsoleFormat(this.config),
        })
      );
      rejectionHandlers.push(
        new winston.transports.Console({
          format: createConsoleFormat(this.config),
        })
      );
    }

    // Create Winston logger
    this.winston = winston.createLogger({
      level: this.config.logLevel.toLowerCase(),
      transports,
      exitOnError: false,
      exceptionHandlers,
      rejectionHandlers,
    });
  }

  /**
   * Core logging method
   */
  private _log(
    level: string,
    message: string,
    req?: any,
    additionalData: Record<string, any> = {}
  ): void {
    if (!this._shouldLog(level)) {
      return;
    }

    // Get tracing context
    const tracingContext = getTracingContext();

    const logData = {
      level: level.toLowerCase(),
      message,
      correlationId: req?.correlationId || additionalData.correlationId || null,
      traceId: tracingContext.traceId,
      spanId: tracingContext.spanId,
      userId: req?.user?.id || additionalData.userId || null,
      operation: additionalData.operation || null,
      duration: additionalData.duration || null,
      businessEvent: additionalData.businessEvent || null,
      securityEvent: additionalData.securityEvent || null,
      error: this._processError(additionalData.error),
      metadata: additionalData.metadata || null,
    };

    // Remove null/undefined values
    Object.keys(logData).forEach((key) => {
      if ((logData as any)[key] === null || (logData as any)[key] === undefined) {
        delete (logData as any)[key];
      }
    });

    this.winston.log(logData);
  }

  /**
   * Process error object to ensure it's serializable
   */
  private _processError(error: any): any {
    if (!error) {
      return null;
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return error;
  }

  /**
   * Check if we should log at this level
   */
  private _shouldLog(level: string): boolean {
    const currentLevelValue =
      LOG_LEVELS[this.config.logLevel.toUpperCase() as keyof typeof LOG_LEVELS]?.value || 1;
    const logLevelValue = LOG_LEVELS[level.toUpperCase() as keyof typeof LOG_LEVELS]?.value || 1;
    return logLevelValue >= currentLevelValue;
  }

  // Public logging methods

  /**
   * Debug level logging
   */
  debug(message: string, req?: any, additionalData: Record<string, any> = {}): void {
    this._log('DEBUG', message, req, additionalData);
  }

  /**
   * Info level logging
   */
  info(message: string, req?: any, additionalData: Record<string, any> = {}): void {
    this._log('INFO', message, req, additionalData);
  }

  /**
   * Warning level logging
   */
  warn(message: string, req?: any, additionalData: Record<string, any> = {}): void {
    this._log('WARN', message, req, additionalData);
  }

  /**
   * Error level logging
   */
  error(message: string, req?: any, additionalData: Record<string, any> = {}): void {
    this._log('ERROR', message, req, additionalData);
  }

  /**
   * Fatal level logging
   */
  fatal(message: string, req?: any, additionalData: Record<string, any> = {}): void {
    this._log('FATAL', message, req, additionalData);
  }

  // Convenience methods

  /**
   * Log operation start
   */
  operationStart(operation: string, req?: any, additionalData: Record<string, any> = {}): number {
    this.debug(`Starting operation: ${operation}`, req, {
      operation,
      operationStart: true,
      ...additionalData,
    });
    return Date.now();
  }

  /**
   * Log operation completion
   */
  operationComplete(
    operation: string,
    startTime: number,
    req?: any,
    additionalData: Record<string, any> = {}
  ): number {
    const duration = Date.now() - startTime;
    this.info(`Completed operation: ${operation}`, req, {
      operation,
      duration,
      operationComplete: true,
      ...additionalData,
    });
    return duration;
  }

  /**
   * Log operation failure
   */
  operationFailed(
    operation: string,
    startTime: number,
    error: any,
    req?: any,
    additionalData: Record<string, any> = {}
  ): number {
    const duration = Date.now() - startTime;
    this.error(`Failed operation: ${operation}`, req, {
      operation,
      duration,
      error,
      operationFailed: true,
      ...additionalData,
    });
    return duration;
  }

  /**
   * Log business events
   */
  business(event: string, req?: any, additionalData: Record<string, any> = {}): void {
    this.info(`Business event: ${event}`, req, {
      businessEvent: event,
      ...additionalData,
    });
  }

  /**
   * Log security events
   */
  security(event: string, req?: any, additionalData: Record<string, any> = {}): void {
    this.warn(`Security event: ${event}`, req, {
      securityEvent: event,
      ...additionalData,
    });
  }

  /**
   * Log performance metrics
   */
  performance(
    operation: string,
    duration: number,
    req?: any,
    additionalData: Record<string, any> = {}
  ): void {
    const level = duration > 1000 ? 'warn' : 'info';
    this._log(level.toUpperCase(), `Performance: ${operation}`, req, {
      operation,
      duration,
      performance: true,
      ...additionalData,
    });
  }

  /**
   * Validate log entry against unified schema
   */
  validateEntry(entry: any): boolean {
    return validateLogEntry(entry);
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

export default Logger;
