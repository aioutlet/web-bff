import { Router, Response } from 'express';
import { userClient } from '@clients/user.client';
import logger from '../core/logger';
import { RequestWithCorrelationId } from '@middleware/correlation-id.middleware';

const router = Router();

// ============================================================================
// Helper function to extract token
// ============================================================================
const getToken = (req: RequestWithCorrelationId): string | null => {
  return req.headers.authorization?.replace('Bearer ', '') || null;
};

const requireAuth = (req: RequestWithCorrelationId, res: Response): string | null => {
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
// Profile Routes
// ============================================================================

/**
 * GET /api/user/profile
 * Get current user profile
 */
router.get('/profile', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = requireAuth(req, res);
    if (!token) return;

    logger.info('Get user profile', {
      correlationId: req.correlationId,
    });

    const profile = await userClient.getProfile(token);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    logger.error('Get user profile error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to get profile',
      },
    });
  }
});

/**
 * PATCH /api/user/profile
 * Update user profile
 */
router.patch('/profile', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = requireAuth(req, res);
    if (!token) return;

    const { firstName, lastName, phone, dateOfBirth } = req.body;

    logger.info('Update user profile', {
      correlationId: req.correlationId,
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
    logger.error('Update user profile error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to update profile',
      },
    });
  }
});

/**
 * DELETE /api/user/profile
 * Delete user account
 */
router.delete('/profile', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = requireAuth(req, res);
    if (!token) return;

    logger.info('Delete user account', {
      correlationId: req.correlationId,
    });

    await userClient.deleteAccount(token);

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error: any) {
    logger.error('Delete user account error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to delete account',
      },
    });
  }
});

// ============================================================================
// Address Routes
// ============================================================================

/**
 * GET /api/user/addresses
 * Get all user addresses
 */
router.get('/addresses', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = requireAuth(req, res);
    if (!token) return;

    logger.info('Get user addresses', {
      correlationId: req.correlationId,
    });

    const addresses = await userClient.getAddresses(token);

    res.json({
      success: true,
      data: addresses,
    });
  } catch (error: any) {
    logger.error('Get user addresses error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to get addresses',
      },
    });
  }
});

/**
 * POST /api/user/addresses
 * Create new address
 */
router.post('/addresses', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = requireAuth(req, res);
    if (!token) return;

    const { type, street, city, state, postalCode, country, isDefault } = req.body;

    logger.info('Create address', {
      correlationId: req.correlationId,
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
    logger.error('Create address error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to create address',
      },
    });
  }
});

/**
 * PATCH /api/user/addresses/:id
 * Update address
 */
router.patch(
  '/addresses/:id',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      const { id } = req.params;
      const { type, street, city, state, postalCode, country, isDefault } = req.body;

      logger.info('Update address', {
        correlationId: req.correlationId,
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
      logger.error('Update address error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to update address',
        },
      });
    }
  }
);

/**
 * DELETE /api/user/addresses/:id
 * Delete address
 */
router.delete(
  '/addresses/:id',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      const { id } = req.params;

      logger.info('Delete address', {
        correlationId: req.correlationId,
        addressId: id,
      });

      await userClient.deleteAddress(id, token);

      res.json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete address error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to delete address',
        },
      });
    }
  }
);

/**
 * PATCH /api/user/addresses/:id/default
 * Set address as default
 */
router.patch(
  '/addresses/:id/default',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      const { id } = req.params;

      logger.info('Set default address', {
        correlationId: req.correlationId,
        addressId: id,
      });

      const address = await userClient.setDefaultAddress(id, token);

      res.json({
        success: true,
        data: address,
      });
    } catch (error: any) {
      logger.error('Set default address error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to set default address',
        },
      });
    }
  }
);

// ============================================================================
// Payment Method Routes
// ============================================================================

/**
 * GET /api/user/payment-methods
 * Get all payment methods
 */
router.get(
  '/payment-methods',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      logger.info('Get payment methods', {
        correlationId: req.correlationId,
      });

      const paymentMethods = await userClient.getPaymentMethods(token);

      res.json({
        success: true,
        data: paymentMethods,
      });
    } catch (error: any) {
      logger.error('Get payment methods error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to get payment methods',
        },
      });
    }
  }
);

/**
 * POST /api/user/payment-methods
 * Create new payment method
 */
router.post(
  '/payment-methods',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      const { type, cardNumber, cardholderName, expiryMonth, expiryYear, cvv, isDefault } =
        req.body;

      logger.info('Create payment method', {
        correlationId: req.correlationId,
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
      logger.error('Create payment method error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to create payment method',
        },
      });
    }
  }
);

/**
 * PATCH /api/user/payment-methods/:id
 * Update payment method
 */
router.patch(
  '/payment-methods/:id',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      const { id } = req.params;
      const { cardholderName, expiryMonth, expiryYear, isDefault } = req.body;

      logger.info('Update payment method', {
        correlationId: req.correlationId,
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
      logger.error('Update payment method error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to update payment method',
        },
      });
    }
  }
);

/**
 * DELETE /api/user/payment-methods/:id
 * Delete payment method
 */
router.delete(
  '/payment-methods/:id',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      const { id } = req.params;

      logger.info('Delete payment method', {
        correlationId: req.correlationId,
        paymentId: id,
      });

      await userClient.deletePaymentMethod(id, token);

      res.json({
        success: true,
        message: 'Payment method deleted successfully',
      });
    } catch (error: any) {
      logger.error('Delete payment method error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to delete payment method',
        },
      });
    }
  }
);

/**
 * PATCH /api/user/payment-methods/:id/default
 * Set payment method as default
 */
router.patch(
  '/payment-methods/:id/default',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      const { id } = req.params;

      logger.info('Set default payment method', {
        correlationId: req.correlationId,
        paymentId: id,
      });

      const paymentMethod = await userClient.setDefaultPaymentMethod(id, token);

      res.json({
        success: true,
        data: paymentMethod,
      });
    } catch (error: any) {
      logger.error('Set default payment method error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to set default payment method',
        },
      });
    }
  }
);

// ============================================================================
// Wishlist Routes
// ============================================================================

/**
 * GET /api/user/wishlist
 * Get user wishlist
 */
router.get('/wishlist', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = requireAuth(req, res);
    if (!token) return;

    logger.info('Get wishlist', {
      correlationId: req.correlationId,
    });

    const wishlist = await userClient.getWishlist(token);

    res.json({
      success: true,
      data: wishlist,
    });
  } catch (error: any) {
    logger.error('Get wishlist error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to get wishlist',
      },
    });
  }
});

/**
 * POST /api/user/wishlist
 * Add item to wishlist
 */
router.post('/wishlist', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = requireAuth(req, res);
    if (!token) return;

    const { productId } = req.body;

    logger.info('Add to wishlist', {
      correlationId: req.correlationId,
      productId,
    });

    const item = await userClient.addToWishlist(productId, token);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error: any) {
    logger.error('Add to wishlist error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to add to wishlist',
      },
    });
  }
});

/**
 * DELETE /api/user/wishlist/:id
 * Remove item from wishlist
 */
router.delete(
  '/wishlist/:id',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = requireAuth(req, res);
      if (!token) return;

      const { id } = req.params;

      logger.info('Remove from wishlist', {
        correlationId: req.correlationId,
        wishlistId: id,
      });

      await userClient.removeFromWishlist(id, token);

      res.json({
        success: true,
        message: 'Item removed from wishlist',
      });
    } catch (error: any) {
      logger.error('Remove from wishlist error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Failed to remove from wishlist',
        },
      });
    }
  }
);

export default router;
