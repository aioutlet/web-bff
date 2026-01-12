/**
 * Auth Routes for Web BFF
 * Route definitions only - all logic is in auth.controller.ts
 */

import { Router, RequestHandler } from 'express';
import * as authController from '@controllers/auth.controller';
import { requireAuth } from '@middleware/auth.middleware';

const router = Router();

// Public Authentication Routes (no auth required)
router.post('/login', authController.login as unknown as RequestHandler);
router.post('/register', authController.register as unknown as RequestHandler);
router.post('/refresh', authController.refreshToken as unknown as RequestHandler);

// Protected Authentication Routes (require auth)
router.post(
  '/logout',
  requireAuth as unknown as RequestHandler,
  authController.logout as unknown as RequestHandler
);

// User Info Routes (require auth)
router.get(
  '/me',
  requireAuth as unknown as RequestHandler,
  authController.getCurrentUser as unknown as RequestHandler
);
router.get(
  '/verify',
  requireAuth as unknown as RequestHandler,
  authController.verifyToken as unknown as RequestHandler
);

// Email Verification Routes
router.get('/email/verify', authController.verifyEmail as unknown as RequestHandler);
router.post('/email/resend', authController.resendVerificationEmail as unknown as RequestHandler);

// Password Management Routes
router.post('/password/forgot', authController.forgotPassword as unknown as RequestHandler); // Public
router.post('/password/reset', authController.resetPassword as unknown as RequestHandler); // Public (uses token from email)
router.post(
  '/password/change',
  requireAuth as unknown as RequestHandler,
  authController.changePassword as unknown as RequestHandler
); // Protected

export default router;
