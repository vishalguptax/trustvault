import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PolicyEngineService } from '../../src/modules/verifier/policy-engine.service';

describe('PolicyEngineService', () => {
  let service: PolicyEngineService;

  const mockPrisma = {};

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PolicyEngineService(mockPrisma as any);
  });

  describe('evaluatePolicy', () => {
    describe('require-trusted-issuer', () => {
      it('should pass when issuer is trusted', async () => {
        const result = await service.evaluatePolicy('require-trusted-issuer', {
          trustResult: { trusted: true },
        });

        expect(result.valid).toBe(true);
        expect(result.policy).toBe('require-trusted-issuer');
        expect(result.error).toBeUndefined();
      });

      it('should fail when issuer is not trusted', async () => {
        const result = await service.evaluatePolicy('require-trusted-issuer', {
          trustResult: { trusted: false, reason: 'Issuer not in registry' },
        });

        expect(result.valid).toBe(false);
        expect(result.policy).toBe('require-trusted-issuer');
        expect(result.error).toBe('Issuer not in registry');
      });

      it('should fail when trustResult is undefined', async () => {
        const result = await service.evaluatePolicy('require-trusted-issuer', {});

        expect(result.valid).toBe(false);
        expect(result.policy).toBe('require-trusted-issuer');
      });
    });

    describe('require-active-status', () => {
      it('should pass when status is valid (active)', async () => {
        const result = await service.evaluatePolicy('require-active-status', {
          statusResult: { valid: true },
        });

        expect(result.valid).toBe(true);
        expect(result.policy).toBe('require-active-status');
        expect(result.error).toBeUndefined();
      });

      it('should fail when credential is revoked', async () => {
        const result = await service.evaluatePolicy('require-active-status', {
          statusResult: { valid: false, error: 'Credential has been revoked' },
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Credential has been revoked');
      });

      it('should fail when statusResult is undefined', async () => {
        const result = await service.evaluatePolicy('require-active-status', {});

        expect(result.valid).toBe(false);
      });
    });

    describe('require-non-expired', () => {
      it('should pass when credential is not expired', async () => {
        const result = await service.evaluatePolicy('require-non-expired', {
          expirationResult: { valid: true },
        });

        expect(result.valid).toBe(true);
        expect(result.policy).toBe('require-non-expired');
        expect(result.error).toBeUndefined();
      });

      it('should fail when credential is expired', async () => {
        const result = await service.evaluatePolicy('require-non-expired', {
          expirationResult: { valid: false, error: 'Credential has expired' },
        });

        expect(result.valid).toBe(false);
        expect(result.error).toBe('Credential has expired');
      });

      it('should fail when expirationResult is undefined', async () => {
        const result = await service.evaluatePolicy('require-non-expired', {});

        expect(result.valid).toBe(false);
      });
    });

    describe('unknown policy', () => {
      it('should pass for unknown policy names', async () => {
        const result = await service.evaluatePolicy('some-future-policy', {});

        expect(result.valid).toBe(true);
        expect(result.policy).toBe('some-future-policy');
      });
    });
  });

  describe('evaluatePolicies', () => {
    it('should return allPassed=true when all policies pass', async () => {
      const result = await service.evaluatePolicies(
        ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
        {
          trustResult: { trusted: true },
          statusResult: { valid: true },
          expirationResult: { valid: true },
        },
      );

      expect(result.allPassed).toBe(true);
      expect(result.results).toHaveLength(3);
      expect(result.results.every((r) => r.valid)).toBe(true);
    });

    it('should return allPassed=false when one policy fails', async () => {
      const result = await service.evaluatePolicies(
        ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
        {
          trustResult: { trusted: true },
          statusResult: { valid: false, error: 'Credential has been revoked' },
          expirationResult: { valid: true },
        },
      );

      expect(result.allPassed).toBe(false);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].valid).toBe(true);
      expect(result.results[1].valid).toBe(false);
      expect(result.results[2].valid).toBe(true);
    });

    it('should return allPassed=false when all policies fail', async () => {
      const result = await service.evaluatePolicies(
        ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
        {
          trustResult: { trusted: false, reason: 'Not trusted' },
          statusResult: { valid: false, error: 'Revoked' },
          expirationResult: { valid: false, error: 'Expired' },
        },
      );

      expect(result.allPassed).toBe(false);
      expect(result.results.every((r) => !r.valid)).toBe(true);
    });

    it('should return allPassed=true for empty policy list', async () => {
      const result = await service.evaluatePolicies([], {});

      expect(result.allPassed).toBe(true);
      expect(result.results).toHaveLength(0);
    });

    it('should evaluate policies in order and return results for each', async () => {
      const result = await service.evaluatePolicies(
        ['require-trusted-issuer', 'require-non-expired'],
        {
          trustResult: { trusted: false, reason: 'Unknown issuer' },
          expirationResult: { valid: true },
        },
      );

      expect(result.results).toHaveLength(2);
      expect(result.results[0].policy).toBe('require-trusted-issuer');
      expect(result.results[0].valid).toBe(false);
      expect(result.results[0].error).toBe('Unknown issuer');
      expect(result.results[1].policy).toBe('require-non-expired');
      expect(result.results[1].valid).toBe(true);
    });
  });
});
