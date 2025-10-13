import { Response, NextFunction } from 'express';
import logger from '@utils/logger';
import { RequestWithCorrelationId } from './correlation-id.middleware';

export const errorMiddleware = (
  err: Error,
  req: RequestWithCorrelationId,
  res: Response,
  _next: NextFunction
) => {
  const correlationId = req.correlationId || 'unknown';

  logger.error('Request error', {
    correlationId,
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
      correlationId,
      ...(config.env !== 'production' && { stack: err.stack }),
    },
  });
};

import config from '@config/index';
