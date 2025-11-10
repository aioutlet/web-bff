/**
 * User Controller for Web BFF
 * Handles all user-related operations including profile, addresses, payment methods, and wishlist
 */

import { Response } from 'express';
import { asyncHandler } from '@middleware/asyncHandler.middleware';
import { userClient } from '@clients/user.client';
import logger from '../core/logger';
import { RequestWithTraceContext } from '@middleware/traceContext.middleware';

// ============================================================================
// Helper function to extract token
// ============================================================================
const getToken = (req: RequestWithTraceContext): string | null => {
  return req.headers.authorization?.replace('Bearer ', '') || null;
};

const requireAuth = (req: RequestWithTraceContext, res: Response): string | null => {
  const token = getToken(req);
  if (!token) {
    res.status(401).json({
      success: false,
      error: { message: 'Authentication required' },
    });
    return null;
  }
  return token;
};

// ============================================================================
// Profile Controllers
// ============================================================================

/**
 * GET /api/user/profile
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {

const { traceId, spanId } = req;
const token = requireAuth(req, res);
if (!token) return;

logger.info('Get user profile', {
  traceId, spanId,
});

const profile = await userClient.getProfile(token);

res.json({
  success: true,
  data: profile,
});
});

/**
 * PATCH /api/user/profile
 * Update user profile
 */
export const updateProfile = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { firstName, lastName, phone, dateOfBirth } = req.body;

    logger.info('Update user profile', {
      traceId, spanId,
    });

    const profile = await userClient.updateProfile(
      { firstName, lastName, phone, dateOfBirth },
      token
    );

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Update user profile error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to update profile',
      },
    });
  }
};

/**
 * DELETE /api/user/profile
 * Delete user account
 */
export const deleteAccount = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    logger.info('Delete user account', {
      traceId, spanId,
    });

    await userClient.deleteAccount(token);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Delete user account error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to delete account',
      },
    });
  }
};

// ============================================================================
// Address Controllers
// ============================================================================

/**
 * GET /api/user/addresses
 * Get all user addresses
 */
export const getAddresses = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {

const { traceId, spanId } = req;
const token = requireAuth(req, res);
if (!token) return;

logger.info('Get user addresses', {
  traceId, spanId,
});

const addresses = await userClient.getAddresses(token);

res.json({
  success: true,
  data: addresses,
});
});

/**
 * POST /api/user/addresses
 * Create new address
 */
export const createAddress = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { type, street, city, state, postalCode, country, isDefault } = req.body;

    logger.info('Create address', {
      traceId, spanId,
    });

    const address = await userClient.createAddress(
      { type, street, city, state, postalCode, country, isDefault },
      token
    );

    res.status(201).json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Create address error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to create address',
      },
    });
  }
};

/**
 * PATCH /api/user/addresses/:id
 * Update address
 */
export const updateAddress = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { id } = req.params;
    const { type, street, city, state, postalCode, country, isDefault } = req.body;

    logger.info('Update address', {
      traceId, spanId,
      addressId: id,
    });

    const address = await userClient.updateAddress(
      id,
      { type, street, city, state, postalCode, country, isDefault },
      token
    );

    res.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Update address error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to update address',
      },
    });
  }
};

/**
 * DELETE /api/user/addresses/:id
 * Delete address
 */
export const deleteAddress = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { id } = req.params;

    logger.info('Delete address', {
      traceId, spanId,
      addressId: id,
    });

    await userClient.deleteAddress(id, token);

    res.json({
      success: true,
      message: 'Address deleted successfully',
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Delete address error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to delete address',
      },
    });
  }
};

/**
 * PATCH /api/user/addresses/:id/default
 * Set address as default
 */
export const setDefaultAddress = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { id } = req.params;

    logger.info('Set default address', {
      traceId, spanId,
      addressId: id,
    });

    const address = await userClient.setDefaultAddress(id, token);

    res.json({
      success: true,
      data: address,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Set default address error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to set default address',
      },
    });
  }
};

// ============================================================================
// Payment Method Controllers
// ============================================================================

/**
 * GET /api/user/payment-methods
 * Get all payment methods
 */
export const getPaymentMethods = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    logger.info('Get payment methods', {
      traceId, spanId,
    });

    const paymentMethods = await userClient.getPaymentMethods(token);

    res.json({
      success: true,
      data: paymentMethods,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Get payment methods error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to get payment methods',
      },
    });
  }
};

/**
 * POST /api/user/payment-methods
 * Create new payment method
 */
export const createPaymentMethod = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { type, cardNumber, cardholderName, expiryMonth, expiryYear, cvv, isDefault } = req.body;

    logger.info('Create payment method', {
      traceId, spanId,
    });

    const paymentMethod = await userClient.createPaymentMethod(
      { type, cardNumber, cardholderName, expiryMonth, expiryYear, cvv, isDefault },
      token
    );

    res.status(201).json({
      success: true,
      data: paymentMethod,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Create payment method error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to create payment method',
      },
    });
  }
};

/**
 * PATCH /api/user/payment-methods/:id
 * Update payment method
 */
export const updatePaymentMethod = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { id } = req.params;
    const { cardholderName, expiryMonth, expiryYear, isDefault } = req.body;

    logger.info('Update payment method', {
      traceId, spanId,
      paymentId: id,
    });

    const paymentMethod = await userClient.updatePaymentMethod(
      id,
      { cardholderName, expiryMonth, expiryYear, isDefault },
      token
    );

    res.json({
      success: true,
      data: paymentMethod,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Update payment method error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to update payment method',
      },
    });
  }
};

/**
 * DELETE /api/user/payment-methods/:id
 * Delete payment method
 */
export const deletePaymentMethod = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { id } = req.params;

    logger.info('Delete payment method', {
      traceId, spanId,
      paymentId: id,
    });

    await userClient.deletePaymentMethod(id, token);

    res.json({
      success: true,
      message: 'Payment method deleted successfully',
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Delete payment method error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to delete payment method',
      },
    });
  }
};

/**
 * PATCH /api/user/payment-methods/:id/default
 * Set payment method as default
 */
export const setDefaultPaymentMethod = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { id } = req.params;

    logger.info('Set default payment method', {
      traceId, spanId,
      paymentId: id,
    });

    const paymentMethod = await userClient.setDefaultPaymentMethod(id, token);

    res.json({
      success: true,
      data: paymentMethod,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Set default payment method error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to set default payment method',
      },
    });
  }
};

// ============================================================================
// Wishlist Controllers
// ============================================================================

/**
 * GET /api/user/wishlist
 * Get user wishlist
 */
export const getWishlist = asyncHandler(async (req: RequestWithTraceContext, res: Response) => {

const { traceId, spanId } = req;
const token = requireAuth(req, res);
if (!token) return;

logger.info('Get wishlist', {
  traceId, spanId,
});

const wishlist = await userClient.getWishlist(token);

res.json({
  success: true,
  data: wishlist,
});
});

/**
 * POST /api/user/wishlist
 * Add item to wishlist
 */
export const addToWishlist = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { productId } = req.body;

    logger.info('Add to wishlist', {
      traceId, spanId,
      productId,
    });

    const item = await userClient.addToWishlist(productId, token);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Add to wishlist error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to add to wishlist',
      },
    });
  }
};

/**
 * DELETE /api/user/wishlist/:id
 * Remove item from wishlist
 */
export const removeFromWishlist = async (
  req: RequestWithTraceContext,
  res: Response
): Promise<void> => {
  try {
    const { traceId, spanId } = req;
    const token = requireAuth(req, res);
    if (!token) return;

    const { id } = req.params;

    logger.info('Remove from wishlist', {
      traceId, spanId,
      wishlistId: id,
    });

    await userClient.removeFromWishlist(id, token);

    res.json({
      success: true,
      message: 'Item removed from wishlist',
    });
  } catch (error: any) {
    const { traceId, spanId } = req;
    logger.error('Remove from wishlist error', {
      traceId, spanId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to remove from wishlist',
      },
    });
  }
};
