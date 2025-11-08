/**
 * Auth Routes for Web BFF
 * Route definitions only - all logic is in auth.controller.ts
 */

import { Router } from 'express';
import * as authController from '@controllers/auth.controller';

const router = Router();

// Authentication Routes
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// User Info Routes
router.get('/me', authController.getCurrentUser);
router.get('/verify', authController.verifyToken);

// Email Verification Routes
router.get('/email/verify', authController.verifyEmail);
router.post('/email/resend', authController.resendVerificationEmail);

// Password Management Routes
router.post('/password/forgot', authController.forgotPassword);
router.post('/password/reset', authController.resetPassword);
router.post('/password/change', authController.changePassword);

export default router;
