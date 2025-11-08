/**
 * Cart Controller for Web BFF
 * Handles all cart operations for both authenticated users and guests
 */

import { Response } from 'express';
import { cartClient } from '@clients/cart.client';
import logger from '../core/logger';
import { RequestWithCorrelationId } from '@middleware/correlation-id.middleware';
import jwt from 'jsonwebtoken';

// ============================================================================
// Helper functions
// ============================================================================
const getToken = (req: RequestWithCorrelationId): string | null => {
  return req.headers.authorization?.replace('Bearer ', '') || null;
};

const getUserIdFromToken = (token: string): string | null => {
  try {
    const decoded = jwt.decode(token) as any;
    return decoded?.sub || decoded?.id || null;
  } catch (error) {
    logger.error('Error decoding JWT token', { error });
    return null;
  }
};

const requireAuth = (
  req: RequestWithCorrelationId,
  res: Response
): { token: string; userId: string } | null => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required' },
    });
    return null;
  }

  const userId = getUserIdFromToken(token);
  if (!userId) {
    res.status(401).json({
      success: false,
      error: { message: 'Invalid authentication token' },
    });
    return null;
  }

  return { token, userId };
};

// ============================================================================
// Authenticated Cart Controllers
// ============================================================================

/**
 * GET /api/cart
 * Get authenticated user's cart
 */
export const getCart = async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    logger.info('Fetching user cart', {
      correlationId: req.correlationId,
      userId: auth.userId,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    const cart = await cartClient.getCart(headers);

    res.json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    logger.error('Error fetching user cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to fetch cart',
      },
    });
  }
};

/**
 * POST /api/cart/items
 * Add item to authenticated user's cart
 */
export const addItem = async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    logger.info('Adding item to cart', {
      correlationId: req.correlationId,
      userId: auth.userId,
      productId: req.body.productId,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    const cart = await cartClient.addItem(req.body, headers);

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    logger.error('Error adding item to cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.error || 'Failed to add item to cart',
      },
    });
  }
};

/**
 * PUT /api/cart/items/:productId
 * Update item quantity in authenticated user's cart
 */
export const updateItem = async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const { productId } = req.params;
    const { quantity } = req.body;

    logger.info('Updating cart item', {
      correlationId: req.correlationId,
      userId: auth.userId,
      productId,
      quantity,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    const cart = await cartClient.updateItem(productId, quantity, headers);

    res.json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    logger.error('Error updating cart item', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to update cart item',
      },
    });
  }
};

/**
 * DELETE /api/cart/items/:productId
 * Remove item from authenticated user's cart
 */
export const removeItem = async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const { productId } = req.params;

    logger.info('Removing item from cart', {
      correlationId: req.correlationId,
      userId: auth.userId,
      productId,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    const cart = await cartClient.removeItem(productId, headers);

    res.json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    logger.error('Error removing item from cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to remove item from cart',
      },
    });
  }
};

/**
 * DELETE /api/cart
 * Clear authenticated user's cart
 */
export const clearCart = async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    logger.info('Clearing cart', {
      correlationId: req.correlationId,
      userId: auth.userId,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    await cartClient.clearCart(headers);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
    });
  } catch (error: any) {
    logger.error('Error clearing cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to clear cart',
      },
    });
  }
};

/**
 * POST /api/cart/transfer
 * Transfer guest cart to authenticated user
 */
export const transferCart = async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const auth = requireAuth(req, res);
    if (!auth) return;

    const { guestId } = req.body;

    if (!guestId) {
      res.status(400).json({
        success: false,
        error: { message: 'Guest ID is required' },
      });
      return;
    }

    logger.info('Transferring guest cart to user', {
      correlationId: req.correlationId,
      userId: auth.userId,
      guestId,
    });

    const headers: Record<string, string> = {
      authorization: req.headers.authorization || '',
      'x-correlation-id': req.correlationId || '',
    };

    const cart = await cartClient.transferCart(guestId, headers);

    res.json({
      success: true,
      data: cart,
      message: 'Cart transferred successfully',
    });
  } catch (error: any) {
    logger.error('Error transferring cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to transfer cart',
      },
    });
  }
};

// ============================================================================
// Guest Cart Controllers
// ============================================================================

/**
 * GET /api/cart/guest/:guestId
 * Get guest cart
 */
export const getGuestCart = async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const { guestId } = req.params;

    logger.info('Fetching guest cart', {
      correlationId: req.correlationId,
      guestId,
    });

    const cart = await cartClient.getGuestCart(guestId);

    res.json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    logger.error('Error fetching guest cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to fetch guest cart',
      },
    });
  }
};

/**
 * POST /api/cart/guest/:guestId/items
 * Add item to guest cart
 */
export const addGuestItem = async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const { guestId } = req.params;

    logger.info('Adding item to guest cart', {
      correlationId: req.correlationId,
      guestId,
      productId: req.body.productId,
    });

    const cart = await cartClient.addGuestItem(guestId, req.body);

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    logger.error('Error adding item to guest cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to add item to guest cart',
      },
    });
  }
};

/**
 * PUT /api/cart/guest/:guestId/items/:productId
 * Update item quantity in guest cart
 */
export const updateGuestItem = async (
  req: RequestWithCorrelationId,
  res: Response
): Promise<void> => {
  try {
    const { guestId, productId } = req.params;
    const { quantity } = req.body;

    logger.info('Updating guest cart item', {
      correlationId: req.correlationId,
      guestId,
      productId,
      quantity,
    });

    const cart = await cartClient.updateGuestItem(guestId, productId, quantity);

    res.json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    logger.error('Error updating guest cart item', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to update guest cart item',
      },
    });
  }
};

/**
 * DELETE /api/cart/guest/:guestId/items/:productId
 * Remove item from guest cart
 */
export const removeGuestItem = async (
  req: RequestWithCorrelationId,
  res: Response
): Promise<void> => {
  try {
    const { guestId, productId } = req.params;

    logger.info('Removing item from guest cart', {
      correlationId: req.correlationId,
      guestId,
      productId,
    });

    const cart = await cartClient.removeGuestItem(guestId, productId);

    res.json({
      success: true,
      data: cart,
    });
  } catch (error: any) {
    logger.error('Error removing item from guest cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to remove item from guest cart',
      },
    });
  }
};

/**
 * DELETE /api/cart/guest/:guestId
 * Clear guest cart
 */
export const clearGuestCart = async (
  req: RequestWithCorrelationId,
  res: Response
): Promise<void> => {
  try {
    const { guestId } = req.params;

    logger.info('Clearing guest cart', {
      correlationId: req.correlationId,
      guestId,
    });

    await cartClient.clearGuestCart(guestId);

    res.json({
      success: true,
      message: 'Guest cart cleared successfully',
    });
  } catch (error: any) {
    logger.error('Error clearing guest cart', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: 'Failed to clear guest cart',
      },
    });
  }
};
