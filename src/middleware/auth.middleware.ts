/**
 * Authentication Middleware for Web BFF
 * Validates JWT tokens and attaches user information to requests
 */

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpMethod } from '@dapr/dapr';
import { RequestWithTraceContext } from './traceContext.middleware';
import logger from '../core/logger';
import { daprClient } from '@clients/dapr.service.client';
import config from '@/core/config';

// Extend request interface to include user information
export interface RequestWithAuth extends RequestWithTraceContext {
  user?: {
    id: string;
    email: string;
    username?: string;
    roles: string[];
    isAdmin: boolean;
    emailVerified: boolean;
  };
}

// Cache JWT config to avoid repeated Dapr calls
let jwtConfigCache: { secret: string; algorithm: string } | null = null;

/**
 * Get JWT configuration from Dapr secret store
 */
async function getJwtConfig(): Promise<{ secret: string; algorithm: string }> {
  if (jwtConfigCache) {
    return jwtConfigCache;
  }

  try {
    // Get JWT secret from Dapr secret store
    const secretStoreResponse = await daprClient.invokeService(
      config.services.auth,
      'api/config/jwt',
      HttpMethod.GET,
      null,
      {}
    );

    jwtConfigCache = {
      secret: secretStoreResponse.secret || process.env.JWT_SECRET || 'fallback-secret-key',
      algorithm: secretStoreResponse.algorithm || 'HS256',
    };

    return jwtConfigCache;
  } catch (error) {
    logger.warn('Failed to fetch JWT config from auth service, using fallback', { error });

    // Fallback to environment variable
    return {
      secret: process.env.JWT_SECRET || 'fallback-secret-key',
      algorithm: 'HS256',
    };
  }
}

/**
 * Extract token from Authorization header or cookies
 */
function extractToken(req: RequestWithAuth): string | null {
  // Check Authorization header
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }

  // Check cookies
  if (req.cookies?.jwt || req.cookies?.token) {
    return req.cookies.jwt || req.cookies.token;
  }

  return null;
}

/**
 * Middleware to require authentication
 * Validates JWT token and attaches user info to request
 */
export const requireAuth = async (
  req: RequestWithAuth,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { traceId, spanId } = req;

  try {
    const token = extractToken(req);

    if (!token) {
      logger.warn('Authentication required: No token provided', { traceId, spanId });
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        traceId,
        spanId,
      });
      return;
    }

    // Get JWT config
    const jwtConfig = await getJwtConfig();

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm as jwt.Algorithm],
    }) as any;

    // Validate standard claims
    if (!decoded.sub && !decoded.id) {
      logger.warn('Invalid token: Missing user identifier', { traceId, spanId });
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        },
        traceId,
        spanId,
      });
      return;
    }

    // Attach user information to request
    req.user = {
      id: decoded.sub || decoded.id,
      email: decoded.email,
      username: decoded.username || decoded.name,
      roles: decoded.roles || [],
      isAdmin: (decoded.roles || []).includes('admin') || decoded.isAdmin || false,
      emailVerified: decoded.emailVerified || false,
    };

    logger.info('User authenticated successfully', {
      traceId,
      spanId,
      userId: req.user.id,
      email: req.user.email,
      roles: req.user.roles,
    });

    next();
  } catch (error: any) {
    const { traceId, spanId } = req;

    // Handle specific JWT errors
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired', { traceId, spanId, error: error.message });
      res.status(401).json({
        success: false,
        error: {
          message: 'Token expired',
          code: 'TOKEN_EXPIRED',
        },
        traceId,
        spanId,
      });
      return;
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token', { traceId, spanId, error: error.message });
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        },
        traceId,
        spanId,
      });
      return;
    }

    if (error.name === 'NotBeforeError') {
      logger.warn('Token not active yet', { traceId, spanId, error: error.message });
      res.status(401).json({
        success: false,
        error: {
          message: 'Token not active',
          code: 'TOKEN_NOT_ACTIVE',
        },
        traceId,
        spanId,
      });
      return;
    }

    // Generic authentication error
    logger.error('Authentication failed', { traceId, spanId, error });
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication failed',
        code: 'AUTH_FAILED',
      },
      traceId,
      spanId,
    });
  }
};

/**
 * Optional authentication middleware
 * Sets user if token is valid, but doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: RequestWithAuth,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const { traceId, spanId } = req;

  try {
    const token = extractToken(req);

    if (!token) {
      // No token provided, continue without user
      req.user = undefined;
      return next();
    }

    // Get JWT config
    const jwtConfig = await getJwtConfig();

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.secret, {
      algorithms: [jwtConfig.algorithm as jwt.Algorithm],
    }) as any;

    // Attach user information if valid
    if (decoded.sub || decoded.id) {
      req.user = {
        id: decoded.sub || decoded.id,
        email: decoded.email,
        username: decoded.username || decoded.name,
        roles: decoded.roles || [],
        isAdmin: (decoded.roles || []).includes('admin') || decoded.isAdmin || false,
        emailVerified: decoded.emailVerified || false,
      };

      logger.debug('Optional auth: User authenticated', {
        traceId,
        spanId,
        userId: req.user.id,
      });
    }

    next();
  } catch (error: any) {
    // Token is invalid, but we don't fail the request
    logger.debug('Optional auth: Token invalid, continuing without user', {
      traceId,
      spanId,
      error: error.message,
    });

    req.user = undefined;
    next();
  }
};

/**
 * Middleware to require specific roles
 * Must be used after requireAuth middleware
 */
export const requireRoles = (...roles: string[]) => {
  return (req: RequestWithAuth, res: Response, next: NextFunction): void => {
    const { traceId, spanId } = req;

    if (!req.user) {
      logger.warn('Authorization check failed: No user in request', { traceId, spanId });
      res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
        traceId,
        spanId,
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      logger.warn('Authorization check failed: Insufficient permissions', {
        traceId,
        spanId,
        userId: req.user.id,
        userRoles,
        requiredRoles: roles,
      });
      res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          code: 'FORBIDDEN',
          details: `Required roles: ${roles.join(', ')}`,
        },
        traceId,
        spanId,
      });
      return;
    }

    logger.debug('Authorization check passed', {
      traceId,
      spanId,
      userId: req.user.id,
      userRoles,
      requiredRoles: roles,
    });

    next();
  };
};

/**
 * Middleware to require admin role
 * Convenience wrapper around requireRoles
 */
export const requireAdmin = requireRoles('admin');
