"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PolicyEngineService = void 0;
const common_1 = require("@nestjs/common");
let PolicyEngineService = class PolicyEngineService {
    async evaluatePolicy(policyName, context) {
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
    async evaluatePolicies(policyNames, context) {
        const results = [];
        for (const policyName of policyNames) {
            const result = await this.evaluatePolicy(policyName, context);
            results.push(result);
        }
        return {
            allPassed: results.every((r) => r.valid),
            results,
        };
    }
};
exports.PolicyEngineService = PolicyEngineService;
exports.PolicyEngineService = PolicyEngineService = __decorate([
    (0, common_1.Injectable)()
], PolicyEngineService);
//# sourceMappingURL=policy-engine.service.js.map