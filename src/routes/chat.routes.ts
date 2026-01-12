/**
 * Chat Routes for Web BFF
 * Proxies chat requests to chat-service via Dapr
 */

import { Router, Response } from 'express';
import { HttpMethod } from '@dapr/dapr';
import daprClient from '../core/daprClient';
import config from '../core/config';
import logger, { withTraceContext } from '../core/logger';
import { requireAuth, optionalAuth, RequestWithAuth } from '@middleware/auth.middleware';

const router = Router();

/**
 * POST /api/chat/message
 * Send a chat message and get AI response
 * Uses optional auth - can work without login for product queries
 */
router.post('/message', optionalAuth, async (req: RequestWithAuth, res: Response) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  const log = withTraceContext(traceId, '');

  try {
    const { message, conversationId, context } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Message is required and must be a string',
      });
    }

    // DEBUG: Log user context from optionalAuth
    logger.debug('[chat.routes] /message endpoint:', {
      hasUser: !!req.user,
      userId: req.user?.id,
      userEmail: req.user?.email,
      messagePreview: message.substring(0, 50),
    });

    log.info('Forwarding chat message to chat-service', {
      userId: req.user?.id,
      conversationId,
      messageLength: message.length,
    });

    // Get authorization header to pass through for order-service calls
    const authHeader = req.headers['authorization'] as string | undefined;

    // Forward to chat-service with user context
    const response = await daprClient.invokeService(
      config.services.chat,
      'api/chat/message',
      HttpMethod.POST,
      {
        message,
        conversationId,
        context,
        userId: req.user?.id, // Will be undefined if not authenticated
        authToken: authHeader, // Pass auth token for downstream service calls
      }
    );

    return res.json(response);
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Failed to process chat message', {
      error: err.message,
      stack: err.stack,
    });

    // Handle specific error cases
    if (err.message?.includes('ECONNREFUSED') || err.message?.includes('not found')) {
      return res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message: 'Chat service is currently unavailable. Please try again later.',
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to process chat message',
    });
  }
});

/**
 * GET /api/chat/history/:conversationId
 * Get conversation history (requires authentication)
 */
router.get('/history/:conversationId', requireAuth, async (req: RequestWithAuth, res: Response) => {
  const traceId = (req.headers['x-trace-id'] as string) || '';
  const log = withTraceContext(traceId, '');

  try {
    const { conversationId } = req.params;

    log.info('Fetching chat history', {
      userId: req.user?.id,
      conversationId,
    });

    const response = await daprClient.invokeService(
      config.services.chat,
      `api/chat/history/${conversationId}`,
      HttpMethod.GET
    );

    return res.json(response);
  } catch (error: unknown) {
    const err = error as Error;
    log.error('Failed to fetch chat history', {
      error: err.message,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: 'Failed to fetch chat history',
    });
  }
});

export default router;
