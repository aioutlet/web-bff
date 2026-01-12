import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Console format for development
const consoleFormat = printf(({ level, message, timestamp, traceId, spanId, ...metadata }: any) => {
  // Remove color codes from level for uppercase conversion
  // eslint-disable-next-line no-control-regex
  const cleanLevel = level.replace(/\u001b\[\d+m/g, '');
  let msg = `${timestamp} [${cleanLevel.toUpperCase()}]`;

  // W3C Trace Context
  if (traceId && spanId) {
    msg += ` [${traceId.substring(0, 8)}...${spanId}]`;
  }

  msg += `: ${message}`;

  const metaStr = Object.keys(metadata).length ? JSON.stringify(metadata, null, 2) : '';
  if (metaStr) {
    msg += ` ${metaStr}`;
  }

  return msg;
});

// JSON format for production
const jsonFormat = printf(({ level, message, timestamp, traceId, spanId, ...metadata }: any) => {
  return JSON.stringify({
    timestamp,
    level,
    message,
    traceId,
    spanId,
    ...metadata,
  });
});

// Determine format based on environment
const logFormat =
  process.env.NODE_ENV === 'production'
    ? combine(timestamp(), errors({ stack: true }), jsonFormat)
    : combine(timestamp(), colorize({ level: true }), errors({ stack: true }), consoleFormat);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

// Add trace context helper
export const withTraceContext = (traceId: string, spanId: string) => {
  return logger.child({ traceId, spanId });
};

export default logger;
