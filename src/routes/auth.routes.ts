import { Router, Response } from 'express';
import { authClient } from '@clients/auth.client';
import logger from '@observability';
import { RequestWithCorrelationId } from '@middleware/correlation-id.middleware';

const router = Router();

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { email, password } = req.body;

    logger.info('Login attempt', {
      correlationId: req.correlationId,
      email,
    });

    const data = await authClient.login({ email, password }, req.correlationId);

    res.json(data);
  } catch (error: any) {
    logger.error('Login error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    // Extract error message - Auth Service returns { success: false, error: "message" }
    const errorMessage =
      error.response?.data?.error || // Auth Service format (error is a string)
      error.response?.data?.message || // Alternative format
      'Login failed';

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: errorMessage,
      },
    });
  }
});

/**
 * POST /api/auth/register
 * User registration
 */
router.post('/register', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    logger.info('Registration attempt', {
      correlationId: req.correlationId,
      email,
    });

    const data = await authClient.register(
      { email, password, firstName, lastName, phoneNumber },
      req.correlationId
    );

    res.json(data);
  } catch (error: any) {
    logger.error('Registration error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Registration failed',
      },
    });
  }
});

/**
 * POST /api/auth/logout
 * User logout
 */
router.post('/logout', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { refreshToken } = req.body;

    logger.info('Logout attempt', {
      correlationId: req.correlationId,
    });

    await authClient.logout(refreshToken, req.correlationId);

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error: any) {
    logger.error('Logout error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Logout failed',
      },
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { refreshToken } = req.body;

    logger.info('Token refresh attempt', {
      correlationId: req.correlationId,
    });

    const data = await authClient.refreshToken({ refreshToken }, req.correlationId);

    res.json(data);
  } catch (error: any) {
    logger.error('Token refresh error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Token refresh failed',
      },
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'No token provided' },
      });
      return;
    }

    logger.info('Get current user', {
      correlationId: req.correlationId,
    });

    const data = await authClient.getCurrentUser(token, req.correlationId);

    res.json(data);
  } catch (error: any) {
    logger.error('Get current user error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to get user',
      },
    });
  }
});

/**
 * GET /api/auth/verify
 * Verify JWT token (dedicated token verification endpoint)
 */
router.get('/verify', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        error: { message: 'Authorization token required' },
      });
      return;
    }

    logger.info('Token verification attempt', {
      correlationId: req.correlationId,
    });

    const data = await authClient.verifyToken(token, req.correlationId);

    res.json(data);
  } catch (error: any) {
    logger.error('Token verification error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Token verification failed',
      },
    });
  }
});

/**
 * GET /api/auth/email/verify
 * Verify email with token
 */
router.get('/email/verify', async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'Token is required' },
      });
      return;
    }

    logger.info('Email verification attempt', {
      correlationId: req.correlationId,
    });

    const data = await authClient.verifyEmail(token, req.correlationId);

    res.json(data);
  } catch (error: any) {
    logger.error('Email verification error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Email verification failed',
      },
    });
  }
});

/**
 * POST /api/auth/email/resend
 * Resend verification email
 */
router.post('/email/resend', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { email } = req.body;

    logger.info('Resend verification email', {
      correlationId: req.correlationId,
      email,
    });

    const data = await authClient.resendVerificationEmail(email, req.correlationId);

    res.json(data);
  } catch (error: any) {
    logger.error('Resend verification email error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Failed to resend verification email',
      },
    });
  }
});

/**
 * POST /api/auth/password/forgot
 * Request password reset
 */
router.post('/password/forgot', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { email } = req.body;

    logger.info('Password reset request', {
      correlationId: req.correlationId,
      email,
    });

    const data = await authClient.forgotPassword({ email }, req.correlationId);

    res.json(data);
  } catch (error: any) {
    logger.error('Password reset request error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Password reset request failed',
      },
    });
  }
});

/**
 * POST /api/auth/password/reset
 * Reset password with token
 */
router.post('/password/reset', async (req: RequestWithCorrelationId, res: Response) => {
  try {
    const { token, password } = req.body;

    logger.info('Password reset', {
      correlationId: req.correlationId,
    });

    const data = await authClient.resetPassword({ token, password }, req.correlationId);

    res.json(data);
  } catch (error: any) {
    logger.error('Password reset error', {
      correlationId: req.correlationId,
      error: error.message,
    });

    res.status(error.response?.status || 500).json({
      success: false,
      error: {
        message: error.response?.data?.message || 'Password reset failed',
      },
    });
  }
});

/**
 * POST /api/auth/password/change
 * Change password for authenticated user
 */
router.post(
  '/password/change',
  async (req: RequestWithCorrelationId, res: Response): Promise<void> => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        res.status(401).json({
          success: false,
          error: { message: 'No token provided' },
        });
        return;
      }

      const { currentPassword, newPassword } = req.body;

      logger.info('Password change attempt', {
        correlationId: req.correlationId,
      });

      const data = await authClient.changePassword(
        { currentPassword, newPassword },
        token,
        req.correlationId
      );

      res.json(data);
    } catch (error: any) {
      logger.error('Password change error', {
        correlationId: req.correlationId,
        error: error.message,
      });

      res.status(error.response?.status || 500).json({
        success: false,
        error: {
          message: error.response?.data?.message || 'Password change failed',
        },
      });
    }
  }
);

export default router;
