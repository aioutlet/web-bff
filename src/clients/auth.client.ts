import axios, { AxiosInstance } from 'axios';
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

export class AuthClient {
  private client: AxiosInstance;
  private sessionCookies: string = '';
  private csrfToken: string = '';

  constructor() {
    this.client = axios.create({
      baseURL: config.services.auth,
      timeout: config.serviceConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enable cookie handling
    });

    // Response interceptor to capture cookies and CSRF tokens
    this.client.interceptors.response.use(
      (response) => {
        // Capture session cookies from Set-Cookie headers
        const setCookieHeader = response.headers['set-cookie'];
        if (setCookieHeader) {
          this.sessionCookies = setCookieHeader.map((cookie) => cookie.split(';')[0]).join('; ');
          logger.debug('Captured session cookies from auth service', {
            cookieCount: setCookieHeader.length,
          });
        }

        // Capture CSRF token from response headers
        const csrfToken = response.headers['x-csrf-token'];
        if (csrfToken) {
          this.csrfToken = csrfToken;
          logger.debug('Captured CSRF token from auth service');
        }

        return response;
      },
      (error) => {
        logger.error('Auth service request failed', {
          error: error.message,
          status: error.response?.status,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/register', data);
    return response.data;
  }

  async logout(refreshToken: string): Promise<void> {
    // Use session cookies and CSRF token for logout
    const config = {
      headers: {} as any,
    };

    // Add session cookies
    if (this.sessionCookies) {
      config.headers.Cookie = this.sessionCookies;
    }

    // Add CSRF token
    if (this.csrfToken) {
      config.headers['X-CSRF-Token'] = this.csrfToken;
    }

    logger.debug('Logout request config', {
      hasCookies: !!this.sessionCookies,
      hasCsrfToken: !!this.csrfToken,
    });

    const response = await this.client.post<void>('/api/auth/logout', { refreshToken }, config);

    // Clear stored session data after successful logout
    this.sessionCookies = '';
    this.csrfToken = '';

    return response.data;
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/api/auth/token/refresh', data);
    return response.data;
  }

  async getCurrentUser(token: string): Promise<any> {
    const response = await this.client.get<any>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  async verifyEmail(token: string): Promise<any> {
    const response = await this.client.get<any>('/api/auth/email/verify', {
      params: { token },
    });
    return response.data;
  }

  async resendVerificationEmail(email: string): Promise<any> {
    const response = await this.client.post<any>('/api/auth/email/resend', { email });
    return response.data;
  }

  async forgotPassword(data: PasswordResetRequest): Promise<any> {
    const response = await this.client.post<any>('/api/auth/password/forgot', data);
    return response.data;
  }

  async resetPassword(data: PasswordResetConfirmRequest): Promise<any> {
    const response = await this.client.post<any>('/api/auth/password/reset', data);
    return response.data;
  }

  async changePassword(data: ChangePasswordRequest, token: string): Promise<any> {
    const response = await this.client.post<any>('/api/auth/password/change', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }
}

export const authClient = new AuthClient();
