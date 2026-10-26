import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthController } from './auth.controller.js';

const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  me: vi.fn(),
  forgetPassword: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  createLinkingIntent: vi.fn(),
  completeGoogleLink: vi.fn(),
  unlinkGoogle: vi.fn(),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    const map: Record<string, string> = {
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_LINKING_CALLBACK_URL: 'http://localhost:3004/auth/link/google/callback',
      FRONTEND_URL: 'http://localhost:5173',
    };
    return map[key] ?? '';
  }),
};

function createController() {
  return new AuthController(mockAuthService as any, mockConfigService as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthController', () => {
  describe('POST /auth/register', () => {
    it('should register a user', async () => {
      const savedUser = { id: 1, email: 'new@test.com' };
      mockAuthService.register.mockResolvedValue(savedUser);

      const controller = createController();
      const result = await controller.register({ email: 'new@test.com', password: 'pass123' });

      expect(mockAuthService.register).toHaveBeenCalledWith('new@test.com', 'pass123');
      expect(result).toEqual(savedUser);
    });
  });

  describe('POST /auth/login', () => {
    it('should return tokens on valid login', async () => {
      const user = { id: 1, email: 'test@test.com', roles: ['user'], tokenVersion: 0 };
      const tokens = { access_token: 'jwt', refresh_token: 'rt', email: 'test@test.com' };
      mockAuthService.login.mockResolvedValue(tokens);

      const controller = createController();
      const result = await controller.login({ user });

      expect(result).toEqual(tokens);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout user', async () => {
      const user = { id: 1 };
      mockAuthService.logout.mockResolvedValue({ message: 'Logout success' });

      const controller = createController();
      const result = await controller.logout({ user });

      expect(mockAuthService.logout).toHaveBeenCalledWith(user);
      expect(result).toEqual({ message: 'Logout success' });
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return new tokens', async () => {
      const tokens = { access_token: 'new-jwt', refresh_token: 'new-rt' };
      mockAuthService.refresh.mockResolvedValue(tokens);

      const controller = createController();
      const result = await controller.refresh({ refresh_token: 'old-rt' });

      expect(mockAuthService.refresh).toHaveBeenCalledWith('old-rt');
      expect(result).toEqual(tokens);
    });
  });

  describe('GET /auth/me', () => {
    it('should return user profile', async () => {
      const profile = { id: 1, email: 'test@test.com', verified: true, roles: ['user'] };
      mockAuthService.me.mockResolvedValue(profile);

      const controller = createController();
      const result = await controller.me({ user: { id: 1 } });

      expect(result).toEqual(profile);
    });
  });

  describe('POST /auth/forget-password', () => {
    it('should request password reset', async () => {
      mockAuthService.forgetPassword.mockResolvedValue({ message: 'Reset password email sent' });

      const controller = createController();
      const result = await controller.forgetPassword({ email: 'test@test.com' } as any);

      expect(mockAuthService.forgetPassword).toHaveBeenCalledWith('test@test.com');
      expect(result).toEqual({ message: 'Reset password email sent' });
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should reset password', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ message: 'Password reset successfully' });

      const controller = createController();
      const result = await controller.resetPassword({ token: 'abc', password: 'newpass' } as any);

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('abc', 'newpass');
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('GET /auth/verify-email', () => {
    it('should verify email', async () => {
      mockAuthService.verifyEmail.mockResolvedValue({ message: 'Email verified successfully' });

      const controller = createController();
      const result = await controller.verifyEmail('valid-token');

      expect(mockAuthService.verifyEmail).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual({ message: 'Email verified successfully' });
    });
  });

  describe('POST /auth/link/google', () => {
    it('should return Google linking URL', async () => {
      mockAuthService.createLinkingIntent.mockResolvedValue('link-token-123');

      const controller = createController();
      const result = await controller.linkGoogle({ user: { id: 1 } });

      expect(result.url).toContain('accounts.google.com');
      expect(result.url).toContain('test-client-id');
      expect(mockAuthService.createLinkingIntent).toHaveBeenCalledWith(1);
    });
  });

  describe('GET /auth/link/google/callback', () => {
    it('should complete Google linking', async () => {
      mockAuthService.completeGoogleLink.mockResolvedValue({ success: true, message: 'Google account linked successfully' });

      const controller = createController();
      const result = await controller.linkGoogleCallback('google-code', 'state-abc');

      expect(mockAuthService.completeGoogleLink).toHaveBeenCalledWith('google-code', 'state-abc');
      expect(result).toEqual({ success: true, message: 'Google account linked successfully' });
    });
  });

  describe('POST /auth/unlink/google', () => {
    it('should unlink Google account', async () => {
      mockAuthService.unlinkGoogle.mockResolvedValue({ success: true, message: 'Google account unlinked successfully' });

      const controller = createController();
      const result = await controller.unlinkGoogle({ user: { id: 1 } });

      expect(mockAuthService.unlinkGoogle).toHaveBeenCalledWith(1);
      expect(result).toEqual({ success: true, message: 'Google account unlinked successfully' });
    });
  });
});
