import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

// --- Mocks ---
const mockUserService = {
  ValidateUser: vi.fn(),
  CreateUser: vi.fn(),
  GetUserByEmail: vi.fn(),
  findOne: vi.fn(),
  hasPassword: vi.fn(),
  toSafeUser: vi.fn((user: any) => ({
    id: user.id,
    email: user.email,
    roles: user.roles,
    tokenVersion: user.tokenVersion,
    verified: user.verified,
  })),
};

const mockJwtService = {
  signAsync: vi.fn().mockResolvedValue('fake-jwt-token'),
};

const mockUserRepo = {
  findOne: vi.fn(),
  findOneBy: vi.fn(),
  save: vi.fn(),
};

const mockTokensRepo = {
  save: vi.fn(),
  findOne: vi.fn(),
  delete: vi.fn(),
};

const mockResetRepo = {
  save: vi.fn(),
  findOneBy: vi.fn(),
};

const mockVerificationRepo = {
  save: vi.fn(),
  findOneBy: vi.fn(),
};

const mockIdentityRepo = {
  findOne: vi.fn(),
  create: vi.fn((data) => data),
  save: vi.fn(),
  remove: vi.fn(),
  count: vi.fn(),
};

const mockLinkingRepo = {
  save: vi.fn(),
  findOneBy: vi.fn(),
  delete: vi.fn(),
};

const mockConfigService = {
  get: vi.fn((key: string) => {
    const map: Record<string, string> = {
      GOOGLE_CLIENT_ID: 'test-client-id',
      GOOGLE_CLIENT_SECRET: 'test-client-secret',
      GOOGLE_LINKING_CALLBACK_URL: 'http://localhost:3004/auth/link/google/callback',
      FRONTEND_URL: 'http://localhost:5173',
      API_KEY_ID: 'rzp_test_key',
      SECRET_KEY: 'rzp_test_secret',
    };
    return map[key] ?? '';
  }),
};

function createService() {
  return new AuthService(
    mockUserService as any,
    mockJwtService as any,
    mockUserRepo as any,
    mockTokensRepo as any,
    mockResetRepo as any,
    mockVerificationRepo as any,
    mockIdentityRepo as any,
    mockLinkingRepo as any,
    mockConfigService as any,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user and never return the password', async () => {
      const savedUser = {
        id: 1,
        email: 'new@test.com',
        roles: ['user'],
        tokenVersion: 0,
        verified: false,
      };
      mockUserRepo.findOne.mockResolvedValue(null);
      mockUserService.CreateUser.mockResolvedValue(savedUser);

      const service = createService();
      const result = await service.register('new@test.com', 'password123');

      expect(mockUserService.CreateUser).toHaveBeenCalledWith('new@test.com', 'password123');
      expect(result).toEqual(savedUser);
      expect((result as any).password).toBeUndefined();
    });

    it('should throw if email already exists', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, email: 'existing@test.com' });

      const service = createService();
      await expect(service.register('existing@test.com', 'pass')).rejects.toThrow(BadRequestException);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user = { id: 1, email: 'test@test.com', roles: ['user'], tokenVersion: 0 };

      const service = createService();
      const result = await service.login(user);

      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.refresh_token).toBeDefined();
      expect(result.email).toBe('test@test.com');
      expect(mockTokensRepo.save).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should throw if no token provided', async () => {
      const service = createService();
      await expect(service.refresh('')).rejects.toThrow(BadRequestException);
    });

    it('should throw if token not found', async () => {
      mockTokensRepo.findOne.mockResolvedValue(null);

      const service = createService();
      await expect(service.refresh('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should rotate token and return new tokens', async () => {
      const storedToken = {
        id: 'tok-1',
        userId: 1,
        token: 'hash',
        expiresAt: new Date(Date.now() + 86400000),
      };
      const user = { id: 1, email: 'test@test.com', roles: ['user'], tokenVersion: 0 };

      mockTokensRepo.findOne.mockResolvedValue(storedToken);
      mockUserService.findOne.mockResolvedValue(user);

      const service = createService();
      const result = await service.refresh('some-token');

      expect(mockTokensRepo.delete).toHaveBeenCalledWith('tok-1');
      expect(result.access_token).toBe('fake-jwt-token');
      expect(result.refresh_token).toBeDefined();
    });

    it('should throw if token is expired', async () => {
      const storedToken = {
        id: 'tok-1',
        userId: 1,
        token: 'hash',
        expiresAt: new Date(Date.now() - 86400000),
      };
      mockTokensRepo.findOne.mockResolvedValue(storedToken);

      const service = createService();
      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete all refresh tokens for user', async () => {
      const service = createService();
      const result = await service.logout({ id: 1 });

      expect(mockTokensRepo.delete).toHaveBeenCalledWith({ userId: 1 });
      expect(result).toEqual({ message: 'Logout success' });
    });
  });

  describe('forgetPassword', () => {
    it('should not reveal whether the email exists', async () => {
      mockUserService.GetUserByEmail.mockResolvedValue(null);

      const service = createService();
      const result = await service.forgetPassword('unknown@test.com');

      expect(result).toEqual({ message: 'If the email exists, a reset link has been sent' });
    });

    it('should create reset token and return success', async () => {
      mockUserService.GetUserByEmail.mockResolvedValue({ id: 1, email: 'test@test.com' });
      mockResetRepo.save.mockResolvedValue({});

      const service = createService();
      const result = await service.forgetPassword('test@test.com');

      expect(result).toEqual({ message: 'If the email exists, a reset link has been sent' });
      expect(mockResetRepo.save).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw for invalid token', async () => {
      mockResetRepo.findOneBy.mockResolvedValue(null);

      const service = createService();
      await expect(service.resetPassword('bad-token', 'newpass')).rejects.toThrow(UnauthorizedException);
    });

    it('should reset password and increment tokenVersion', async () => {
      const reset = { userId: 1, used: false, expiresAt: new Date(Date.now() + 86400000) };
      const user = { id: 1, password: 'old', tokenVersion: 0 };

      mockResetRepo.findOneBy.mockResolvedValue(reset);
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockResolvedValue(user);
      mockResetRepo.save.mockResolvedValue(reset);

      const service = createService();
      const result = await service.resetPassword('valid-token', 'newpass123');

      expect(user.tokenVersion).toBe(1);
      expect(reset.used).toBe(true);
      expect(result).toEqual({ message: 'Password reset successfully' });
    });
  });

  describe('verifyEmail', () => {
    it('should throw for invalid token', async () => {
      mockVerificationRepo.findOneBy.mockResolvedValue(null);

      const service = createService();
      await expect(service.verifyEmail('bad-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should mark user as verified', async () => {
      const verification = { userId: 1, used: false, expiresAt: new Date(Date.now() + 86400000) };
      const user = { id: 1, verified: false };

      mockVerificationRepo.findOneBy.mockResolvedValue(verification);
      mockUserRepo.findOneBy.mockResolvedValue(user);
      mockUserRepo.save.mockResolvedValue(user);
      mockVerificationRepo.save.mockResolvedValue(verification);

      const service = createService();
      const result = await service.verifyEmail('valid-token');

      expect(user.verified).toBe(true);
      expect(result).toEqual({ message: 'Email verified successfully' });
    });
  });

  describe('me', () => {
    it('should return user profile', async () => {
      const user = { id: 1, email: 'test@test.com', verified: true, tokenVersion: 1, roles: ['admin'] };
      mockUserService.findOne.mockResolvedValue(user);

      const service = createService();
      const result = await service.me({ id: 1 } as any);

      expect(result).toEqual({
        id: 1,
        email: 'test@test.com',
        verified: true,
        tokenVersion: 1,
        roles: ['admin'],
      });
    });

    it('should throw if user not found', async () => {
      mockUserService.findOne.mockResolvedValue(null);

      const service = createService();
      await expect(service.me({ id: 999 } as any)).rejects.toThrow(UnauthorizedException);
    });
  });
});
