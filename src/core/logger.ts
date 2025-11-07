import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Console format for development
const consoleFormat = printf(({ level, message, timestamp, correlationId, ...metadata }) => {
  let msg = `${timestamp} [${level}]`;
  
  if (correlationId) {
    msg += ` [${correlationId}]`;
  }
  
  msg += `: ${message}`;

  const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
  if (metaStr) {
    msg += ` ${metaStr}`;
  }

  return msg;
});

// JSON format for production
const jsonFormat = printf(({ level, message, timestamp, correlationId, ...metadata }) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    correlationId: correlationId || 'no-correlation',
    ...metadata,
  });
});

// Determine format based on environment
const logFormat =
  process.env.NODE_ENV === 'production'
    ? combine(timestamp(), errors({ stack: true }), jsonFormat)
    : combine(timestamp(), errors({ stack: true }), colorize(), consoleFormat);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

// Add correlation ID helper
export const withCorrelationId = (correlationId: string) => {
  return logger.child({ correlationId });
};

export default logger;
