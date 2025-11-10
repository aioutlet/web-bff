import { Response, NextFunction } from 'express';
import logger from '../core/logger';
import { RequestWithTraceContext } from './traceContext.middleware';

export const errorMiddleware = (
  err: Error,
  req: RequestWithTraceContext,
  res: Response,
  _next: NextFunction
) => {
  const { traceId, spanId } = req;

  logger.error('Request error', {
    traceId,
    spanId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Check if headers already sent
  if (res.headersSent) {
    return;
  }

  // Default error response
  const statusCode = (err as any).statusCode || 500;
  const message = config.env === 'production' ? 'Internal server error' : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      traceId,
      spanId,
      ...(config.env !== 'production' && { stack: err.stack }),
    },
  });
};

import config from '@/core/config';
