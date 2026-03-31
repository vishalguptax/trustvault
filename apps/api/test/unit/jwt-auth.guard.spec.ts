import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { IS_PUBLIC_KEY } from '../../src/modules/auth/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  const mockJwtService = {
    verifyAsync: vi.fn(),
  };

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  const mockAuthService = {
    validateUser: vi.fn(),
  };

  function createMockContext(token?: string, isArray = false) {
    const request: Record<string, unknown> = {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    };
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      _request: request,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new JwtAuthGuard(
      mockJwtService as any,
      mockReflector as any,
      mockAuthService as any,
    );
  });

  describe('public routes', () => {
    it('should allow access when @Public() decorator is present', async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);
      const context = createMockContext();

      const result = await guard.canActivate(context as any);

      expect(result).toBe(true);
      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_PUBLIC_KEY,
        [context.getHandler(), context.getClass()],
      );
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('protected routes', () => {
    beforeEach(() => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
    });

    it('should allow access with a valid access token', async () => {
      const mockUser = { id: 'user-1', email: 'a@b.com', role: 'holder', active: true };
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', role: 'holder', type: 'access' });
      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const context = createMockContext('valid-token');
      const result = await guard.canActivate(context as any);

      expect(result).toBe(true);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(mockAuthService.validateUser).toHaveBeenCalledWith('user-1');
      expect((context._request as Record<string, unknown>).user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      const context = createMockContext();

      await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context as any)).rejects.toThrow('Missing authentication token');
    });

    it('should throw UnauthorizedException when authorization header has no Bearer prefix', async () => {
      const context = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Basic some-token' },
          }),
        }),
      };

      await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token type is not access', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', role: 'holder', type: 'refresh' });

      const context = createMockContext('refresh-token');

      await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context as any)).rejects.toThrow('Invalid token type');
    });

    it('should throw UnauthorizedException when JWT verification fails', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      const context = createMockContext('expired-token');

      await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context as any)).rejects.toThrow('Invalid or expired token');
    });

    it('should re-throw UnauthorizedException from validateUser', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 'user-1', role: 'holder', type: 'access' });
      mockAuthService.validateUser.mockRejectedValue(
        new UnauthorizedException('User not found or deactivated'),
      );

      const context = createMockContext('valid-token');

      await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
      await expect(guard.canActivate(context as any)).rejects.toThrow('User not found or deactivated');
    });

    it('should throw UnauthorizedException when Bearer token is empty', async () => {
      const context = {
        getHandler: vi.fn(),
        getClass: vi.fn(),
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer ' },
          }),
        }),
      };

      await expect(guard.canActivate(context as any)).rejects.toThrow(UnauthorizedException);
    });
  });
});
