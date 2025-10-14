import { BaseClient } from './base.client';
import config from '@config/index';

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
  constructor() {
    super(config.services.auth, 'auth-service');
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/auth/login', data);
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/auth/register', data);
  }

  async logout(refreshToken: string): Promise<void> {
    return this.post<void>('/api/auth/logout', { refreshToken });
  }

  async refreshToken(data: RefreshTokenRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/api/auth/token/refresh', data);
  }

  async getCurrentUser(token: string): Promise<any> {
    return this.get<any>('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async verifyEmail(token: string): Promise<any> {
    return this.get<any>('/api/auth/email/verify', {
      params: { token },
    });
  }

  async resendVerificationEmail(email: string): Promise<any> {
    return this.post<any>('/api/auth/email/resend', { email });
  }

  async forgotPassword(data: PasswordResetRequest): Promise<any> {
    return this.post<any>('/api/auth/password/forgot', data);
  }

  async resetPassword(data: PasswordResetConfirmRequest): Promise<any> {
    return this.post<any>('/api/auth/password/reset', data);
  }

  async changePassword(data: ChangePasswordRequest, token: string): Promise<any> {
    return this.post<any>('/api/auth/password/change', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

export const authClient = new AuthClient();
