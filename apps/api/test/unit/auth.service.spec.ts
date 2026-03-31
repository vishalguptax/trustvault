import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from '../../src/modules/auth/auth.service';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  compare: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const mockJwtService = {
    signAsync: vi.fn(),
    verifyAsync: vi.fn(),
  };

  const mockConfigService = {
    get: vi.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'holder',
    active: true,
    passwordHash: 'hashed-password',
    refreshTokens: [],
    apiKeys: [],
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    service = new AuthService(
      mockPrisma as any,
      mockJwtService as any,
      mockConfigService as any,
    );

    mockJwtService.signAsync.mockImplementation(async (payload: { type: string }) => {
      return payload.type === 'access' ? 'mock-access-token' : 'mock-refresh-token';
    });
  });

  describe('register', () => {
    it('should create a user, hash password, and return tokens', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue('hashed-pw');
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, passwordHash: 'hashed-pw' });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.register('test@example.com', 'password123', 'Test User');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-pw',
          name: 'Test User',
          role: 'holder',
          active: true,
          refreshTokens: [],
          apiKeys: [],
        },
      });
      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.user.role).toBe('holder');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should use custom role when provided', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue('hashed-pw');
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, role: 'issuer' });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.register('test@example.com', 'password123', 'Test User', 'issuer');

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ role: 'issuer' }),
        }),
      );
      expect(result.user.role).toBe('issuer');
    });

    it('should throw ConflictException if email already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register('test@example.com', 'password123', 'Test User'),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.login('test@example.com', 'password123');

      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nobody@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await expect(
        service.login('test@example.com', 'wrong-password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });

      await expect(
        service.login('test@example.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('should return new token pair for valid refresh token', async () => {
      const { createHash } = await import('crypto');
      const hashedToken = createHash('sha256').update('valid-refresh-token').digest('hex');

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        role: 'holder',
        type: 'refresh',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokens: [hashedToken],
      });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.refreshToken('valid-refresh-token');

      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
    });

    it('should throw UnauthorizedException for invalid/expired refresh token', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(
        service.refreshToken('expired-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token type is not refresh', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        role: 'holder',
        type: 'access',
      });

      await expect(
        service.refreshToken('access-token-used-as-refresh'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        role: 'holder',
        type: 'refresh',
      });
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });

      await expect(
        service.refreshToken('some-token'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should revoke all tokens on token reuse detection', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        role: 'holder',
        type: 'refresh',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshTokens: ['some-other-hash'],
      });
      mockPrisma.user.update.mockResolvedValue(mockUser);

      await expect(
        service.refreshToken('reused-token'),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { refreshTokens: [] },
      });
    });
  });

  describe('logout', () => {
    it('should clear all refresh tokens', async () => {
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.logout('user-123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { refreshTokens: [] },
      });
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('validateUser', () => {
    it('should return sanitized user for valid active user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.validateUser('user-123');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
      expect(result).not.toHaveProperty('refreshTokens');
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.validateUser('non-existent')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for deactivated user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, active: false });

      await expect(service.validateUser('user-123')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens with correct payloads', async () => {
      const result = await service.generateTokens('user-123', 'holder');

      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-123', role: 'holder', type: 'access' },
        { expiresIn: '15m' },
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        { sub: 'user-123', role: 'holder', type: 'refresh' },
        { expiresIn: '7d' },
      );
      expect(result.access_token).toBe('mock-access-token');
      expect(result.refresh_token).toBe('mock-refresh-token');
    });
  });

  describe('generateApiKey', () => {
    it('should generate and store an API key', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const result = await service.generateApiKey('user-123', 'test-key');

      expect(result.apiKey).toMatch(/^tvk_/);
      expect(result.name).toBe('test-key');
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-123' },
          data: {
            apiKeys: {
              push: expect.objectContaining({
                hash: expect.any(String),
                name: 'test-key',
                createdAt: expect.any(String),
              }),
            },
          },
        }),
      );
    });

    it('should throw NotFoundException for non-existent user', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.generateApiKey('non-existent', 'key')).rejects.toThrow(NotFoundException);
    });
  });

  describe('validateApiKey', () => {
    it('should return user for valid API key', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await service.validateApiKey('tvk_somekey');

      expect(result.id).toBe('user-123');
      expect(result.email).toBe('test@example.com');
    });

    it('should throw UnauthorizedException for invalid API key', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      await expect(service.validateApiKey('tvk_invalid')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('hashApiKey', () => {
    it('should produce a deterministic SHA-256 hash', () => {
      const hash1 = service.hashApiKey('test-key');
      const hash2 = service.hashApiKey('test-key');
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64);
    });

    it('should produce different hashes for different keys', () => {
      const hash1 = service.hashApiKey('key-a');
      const hash2 = service.hashApiKey('key-b');
      expect(hash1).not.toBe(hash2);
    });
  });
});
