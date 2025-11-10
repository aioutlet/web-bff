import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import logger from '@/core/logger';

export interface RequestWithTraceContext extends Request {
  traceId: string;
  spanId: string;
  logger: ReturnType<typeof logger.child>;
}

/**
 * Extract trace context from traceparent header
 * Format: 00-{traceId}-{spanId}-{flags}
 */
function extractTraceContext(traceparent: string): { traceId: string; spanId: string } | null {
  const parts = traceparent.split('-');
  if (parts.length !== 4) return null;

  const [version, traceId, spanId] = parts;

  // Validate format
  if (version !== '00') return null;
  if (!/^[0-9a-f]{32}$/.test(traceId)) return null;
  if (!/^[0-9a-f]{16}$/.test(spanId)) return null;

  return { traceId, spanId };
}

/**
 * Generate new trace context
 */
function generateTraceContext(): { traceId: string; spanId: string } {
  return {
    traceId: randomBytes(16).toString('hex'), // 32 hex chars
    spanId: randomBytes(8).toString('hex'), // 16 hex chars
  };
}

/**
 * Middleware to extract or generate W3C Trace Context
 */
export const traceContextMiddleware = (
  req: RequestWithTraceContext,
  res: Response,
  next: NextFunction
): void => {
  // Try to extract from traceparent header
  const traceparent = req.headers['traceparent'] as string;
  let traceContext = traceparent ? extractTraceContext(traceparent) : null;

  // Generate new context if not provided or invalid
  if (!traceContext) {
    traceContext = generateTraceContext();
  }

  // Attach to request
  req.traceId = traceContext.traceId;
  req.spanId = traceContext.spanId;
  req.logger = logger.child({ traceId: traceContext.traceId, spanId: traceContext.spanId });

  // Add to response headers
  res.setHeader('traceparent', `00-${traceContext.traceId}-${traceContext.spanId}-01`);

  next();
};
