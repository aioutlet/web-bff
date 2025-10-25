import { BaseClient } from './base.client';
import config from '@config/index';
import logger from '@observability';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export class AuthClient extends BaseClient {
  private sessionCookies: string = '';
  private csrfToken: string = '';

  constructor() {
    super(config.services.auth, 'auth-service');

    // Response interceptor to capture cookies and CSRF tokens
    this.client.interceptors.response.use(
      (response) => {
        // Extract correlation ID from response or request headers
        const correlationId =
          response.headers['x-correlation-id'] || response.config.headers?.['x-correlation-id'];

        // Capture session cookies from Set-Cookie headers
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          this.sessionCookies = setCookieHeader.map((cookie) => cookie.split(';')[0]).join('; ');
          logger.debug('Captured session cookies from auth service', {
            cookieCount: setCookieHeader.length,
            correlationId,
          });
        }

        // Capture CSRF token from response headers
        const csrfToken = response.headers['x-csrf-token'];
        if (csrfToken) {
          this.csrfToken = csrfToken;
          logger.debug('Captured CSRF token from auth service', {
            correlationId,
          });
        }

        return response;
      },
      (error) => {
        const correlationId =
          error.response?.headers?.['x-correlation-id'] ||
          error.config?.headers?.['x-correlation-id'];

        logger.error('Auth service request failed', {
          error: error.message,
          status: error.response?.status,
          url: error.config?.url,
          correlationId,
        });
        return Promise.reject(error);
      }
    );
  }

  async login(data: LoginRequest, correlationId?: string): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/auth/login', data, this.withCorrelationId(correlationId));
  }

  async register(data: RegisterRequest, correlationId?: string): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      '/api/auth/register',
      data,
      this.withCorrelationId(correlationId)
    );
  }

  async logout(refreshToken: string, correlationId?: string): Promise<void> {
    // Use session cookies and CSRF token for logout
    const config = this.withCorrelationId(correlationId, {});

    // Add session cookies
    if (this.sessionCookies) {
      config.headers = { ...config.headers, Cookie: this.sessionCookies };
    }

    // Add CSRF token
    if (this.csrfToken) {
      config.headers = { ...config.headers, 'X-CSRF-Token': this.csrfToken };
    }

    logger.debug('Logout request config', {
      hasCookies: !!this.sessionCookies,
      hasCsrfToken: !!this.csrfToken,
    });

    await this.post<void>('/api/auth/logout', { refreshToken }, config);

    // Clear stored session data after successful logout
    this.sessionCookies = '';
    this.csrfToken = '';
  }

  async refreshToken(data: RefreshTokenRequest, correlationId?: string): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      '/api/auth/token/refresh',
      data,
      this.withCorrelationId(correlationId)
    );
  }

  async getCurrentUser(token: string, correlationId?: string): Promise<any> {
    const config = this.withCorrelationId(correlationId, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return this.get<any>('/api/auth/me', config);
  }

  async verifyToken(token: string, correlationId?: string): Promise<any> {
    const config = this.withCorrelationId(correlationId, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return this.get<any>('/api/auth/verify', config);
  }

  async verifyEmail(token: string, correlationId?: string): Promise<any> {
    const config = this.withCorrelationId(correlationId, { params: { token } });
    return this.get<any>('/api/auth/email/verify', config);
  }

  async resendVerificationEmail(email: string, correlationId?: string): Promise<any> {
    return this.post<any>(
      '/api/auth/email/resend',
      { email },
      this.withCorrelationId(correlationId)
    );
  }

  async forgotPassword(data: PasswordResetRequest, correlationId?: string): Promise<any> {
    return this.post<any>('/api/auth/password/forgot', data, this.withCorrelationId(correlationId));
  }

  async resetPassword(data: PasswordResetConfirmRequest, correlationId?: string): Promise<any> {
    return this.post<any>('/api/auth/password/reset', data, this.withCorrelationId(correlationId));
  }

  async changePassword(
    data: ChangePasswordRequest,
    token: string,
    correlationId?: string
  ): Promise<any> {
    const config = this.withCorrelationId(correlationId, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return this.post<any>('/api/auth/password/change', data, config);
  }
}

export const authClient = new AuthClient();
