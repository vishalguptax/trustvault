import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../../src/modules/auth/guards/roles.guard';
import { ROLES_KEY } from '../../src/modules/auth/decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;

  const mockReflector = {
    getAllAndOverride: vi.fn(),
  };

  function createMockContext(user?: { role: string } | null) {
    return {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new RolesGuard(mockReflector as any);
  });

  describe('when no roles are required', () => {
    it('should allow access when no @Roles() decorator is present', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext({ role: 'holder' });

      expect(guard.canActivate(context as any)).toBe(true);
    });

    it('should allow access when @Roles() has empty array', () => {
      mockReflector.getAllAndOverride.mockReturnValue([]);
      const context = createMockContext({ role: 'holder' });

      expect(guard.canActivate(context as any)).toBe(true);
    });
  });

  describe('when roles are required', () => {
    it('should allow access when user has a matching role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin', 'issuer']);
      const context = createMockContext({ role: 'admin' });

      expect(guard.canActivate(context as any)).toBe(true);
    });

    it('should allow access when user has second matching role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin', 'issuer']);
      const context = createMockContext({ role: 'issuer' });

      expect(guard.canActivate(context as any)).toBe(true);
    });

    it('should throw ForbiddenException when user role does not match', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockContext({ role: 'holder' });

      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context as any)).toThrow(
        "Access denied: requires one of [admin], but user has role 'holder'",
      );
    });

    it('should throw ForbiddenException when user has no role', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockContext({ role: '' });

      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException when user is null', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockContext(null);

      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context as any)).toThrow('Access denied: no role assigned');
    });

    it('should throw ForbiddenException when user is undefined (no auth)', () => {
      mockReflector.getAllAndOverride.mockReturnValue(['admin']);
      const context = createMockContext(undefined);

      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    });
  });

  describe('reflector integration', () => {
    it('should query reflector with ROLES_KEY and correct targets', () => {
      mockReflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockContext({ role: 'holder' });

      guard.canActivate(context as any);

      expect(mockReflector.getAllAndOverride).toHaveBeenCalledWith(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );
    });
  });
});
