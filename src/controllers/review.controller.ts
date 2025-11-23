/**
 * Review Controller for Web BFF
 * Handles review-related operations
 */

import { Response } from 'express';
import { asyncHandler } from '@middleware/asyncHandler.middleware';
import { RequestWithTraceContext } from '@middleware/traceContext.middleware';
import { reviewClient } from '@clients/review.client';
import logger from '@/core/logger';

/**
 * POST /api/reviews
 * Create a new review
 */
export const createReview = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const reviewData = req.body;

  logger.info('Creating review', {
    traceId,
    spanId,
    productId: reviewData.productId,
    userId: req.user?.sub,
  });

  // Add user information from auth context
  const enrichedData = {
    ...reviewData,
    userId: req.user?.sub,
    userEmail: req.user?.email || reviewData.email,
    userName: req.user?.name || reviewData.author,
  };

  const headers = {
    authorization: req.get('authorization') || '',
    'X-Correlation-Id': req.correlationId || 'no-correlation',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const result = await reviewClient.createReview(enrichedData, headers);

  logger.info('Review created successfully', {
    traceId,
    spanId,
    reviewId: result.data?.id,
  });

  res.status(201).json({
    success: true,
    data: result.data,
  });
});

/**
 * PUT /api/reviews/:id
 * Update an existing review
 */
export const updateReview = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;
  const reviewData = req.body;

  logger.info('Updating review', {
    traceId,
    spanId,
    reviewId: id,
    userId: req.user?.sub,
  });

  const headers = {
    authorization: req.get('authorization') || '',
    'X-Correlation-Id': req.correlationId || 'no-correlation',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  const result = await reviewClient.updateReview(id, reviewData, headers);

  logger.info('Review updated successfully', {
    traceId,
    spanId,
    reviewId: id,
  });

  res.json({
    success: true,
    data: result.data,
  });
});

/**
 * DELETE /api/reviews/:id
 * Delete a review
 */
export const deleteReview = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {
  const { traceId, spanId } = req;
  const { id } = req.params;

  logger.info('Deleting review', {
    traceId,
    spanId,
    reviewId: id,
    userId: req.user?.sub,
  });

  const headers = {
    authorization: req.get('authorization') || '',
    'X-Correlation-Id': req.correlationId || 'no-correlation',
    traceparent: `00-${traceId}-${spanId}-01`,
  };

  await reviewClient.deleteReview(id, headers);

  logger.info('Review deleted successfully', {
    traceId,
    spanId,
    reviewId: id,
  });

  res.json({
    success: true,
    message: 'Review deleted successfully',
  });
});
