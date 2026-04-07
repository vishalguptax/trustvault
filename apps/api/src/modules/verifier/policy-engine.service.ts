import { Injectable } from '@nestjs/common';

export interface PolicyEvaluationResult {
  valid: boolean;
  policy: string;
  error?: string;
}

@Injectable()
export class PolicyEngineService {
  async evaluatePolicy(
    policyName: string,
    context: {
      trustResult?: { trusted: boolean; reason?: string };
      statusResult?: { valid: boolean; error?: string };
      expirationResult?: { valid: boolean; error?: string };
    },
  ): Promise<PolicyEvaluationResult> {
    switch (policyName) {
      case 'require-trusted-issuer':
        return {
          valid: context.trustResult?.trusted ?? false,
          policy: policyName,
          error: context.trustResult?.trusted ? undefined : context.trustResult?.reason,
        };

      case 'require-active-status':
        return {
          valid: context.statusResult?.valid ?? false,
          policy: policyName,
          error: context.statusResult?.valid ? undefined : context.statusResult?.error,
        };

      case 'require-non-expired':
        return {
          valid: context.expirationResult?.valid ?? false,
          policy: policyName,
          error: context.expirationResult?.valid ? undefined : context.expirationResult?.error,
        };

      default:
        return { valid: true, policy: policyName };
    }
  }

  async evaluatePolicies(
    policyNames: string[],
    context: {
      trustResult?: { trusted: boolean; reason?: string };
      statusResult?: { valid: boolean; error?: string };
      expirationResult?: { valid: boolean; error?: string };
    },
  ): Promise<{ allPassed: boolean; results: PolicyEvaluationResult[] }> {
    const results: PolicyEvaluationResult[] = [];

    for (const policyName of policyNames) {
      const result = await this.evaluatePolicy(policyName, context);
      results.push(result);
    }

    return {
      allPassed: results.every((r) => r.valid),
      results,
    };
  }
}
