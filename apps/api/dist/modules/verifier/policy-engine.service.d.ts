export interface PolicyEvaluationResult {
    valid: boolean;
    policy: string;
    error?: string;
}
export declare class PolicyEngineService {
    evaluatePolicy(policyName: string, context: {
        trustResult?: {
            trusted: boolean;
            reason?: string;
        };
        statusResult?: {
            valid: boolean;
            error?: string;
        };
        expirationResult?: {
            valid: boolean;
            error?: string;
        };
    }): Promise<PolicyEvaluationResult>;
    evaluatePolicies(policyNames: string[], context: {
        trustResult?: {
            trusted: boolean;
            reason?: string;
        };
        statusResult?: {
            valid: boolean;
            error?: string;
        };
        expirationResult?: {
            valid: boolean;
            error?: string;
        };
    }): Promise<{
        allPassed: boolean;
        results: PolicyEvaluationResult[];
    }>;
}
//# sourceMappingURL=policy-engine.service.d.ts.map