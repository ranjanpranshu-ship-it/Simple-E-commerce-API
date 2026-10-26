import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from './user.service.js';
import * as bcrypt from 'bcrypt';

const mockUserRepo = {
  findOne: vi.fn(),
  create: vi.fn((data) => data),
  save: vi.fn((data) => Promise.resolve(data)),
};

function createService() {
  return new UserService(mockUserRepo as any);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('UserService', () => {
  describe('CreateUser', () => {
    it('should hash password and save user', async () => {
      const user = { email: 'test@test.com', password: 'hashed' };
      mockUserRepo.save.mockResolvedValue(user);

      const service = createService();
      const result = await service.CreateUser('test@test.com', 'plainpass');

      expect(result.email).toBe('test@test.com');
      expect(result.password).not.toBe('plainpass');
      expect(mockUserRepo.save).toHaveBeenCalled();
    });
  });

  describe('ValidateUser', () => {
    it('should return user data if credentials match', async () => {
      const hashed = await bcrypt.hash('correctpass', 10);
      const user = { id: 1, email: 'test@test.com', password: hashed, roles: ['user'], tokenVersion: 0 };
      mockUserRepo.findOne.mockResolvedValue(user);

      const service = createService();
      const result = await service.ValidateUser('test@test.com', 'correctpass');

      expect(result).toEqual({
        id: 1,
        email: 'test@test.com',
        roles: ['user'],
        tokenVersion: 0,
      });
    });

    it('should return null if password is wrong', async () => {
      const hashed = await bcrypt.hash('correctpass', 10);
      const user = { id: 1, email: 'test@test.com', password: hashed };
      mockUserRepo.findOne.mockResolvedValue(user);

      const service = createService();
      const result = await service.ValidateUser('test@test.com', 'wrongpass');

      expect(result).toBeNull();
    });

    it('should return null if user not found', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const service = createService();
      const result = await service.ValidateUser('ghost@test.com', 'pass');

      expect(result).toBeNull();
    });
  });

  describe('hasPassword', () => {
    it('should return true if user has a password', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, password: 'hashed' });

      const service = createService();
      const result = await service.hasPassword(1);

      expect(result).toBe(true);
    });

    it('should return false if user has no password', async () => {
      mockUserRepo.findOne.mockResolvedValue({ id: 1, password: null });

      const service = createService();
      const result = await service.hasPassword(1);

      expect(result).toBe(false);
    });
  });
});   