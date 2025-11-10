/**
 * Auth Routes for Web BFF
 * Route definitions only - all logic is in auth.controller.ts
 */

import { Router, RequestHandler } from 'express';
import * as authController from '@controllers/auth.controller';

const router = Router();

// Authentication Routes
router.post('/login', authController.login as unknown as RequestHandler);
router.post('/register', authController.register as unknown as RequestHandler);
router.post('/logout', authController.logout as unknown as RequestHandler);
router.post('/refresh', authController.refreshToken as unknown as RequestHandler);

// User Info Routes
router.get('/me', authController.getCurrentUser as unknown as RequestHandler);
router.get('/verify', authController.verifyToken as unknown as RequestHandler);

// Email Verification Routes
router.get('/email/verify', authController.verifyEmail as unknown as RequestHandler);
router.post('/email/resend', authController.resendVerificationEmail as unknown as RequestHandler);

// Password Management Routes
router.post('/password/forgot', authController.forgotPassword as unknown as RequestHandler);
router.post('/password/reset', authController.resetPassword as unknown as RequestHandler);
router.post('/password/change', authController.changePassword as unknown as RequestHandler);

export default router;
