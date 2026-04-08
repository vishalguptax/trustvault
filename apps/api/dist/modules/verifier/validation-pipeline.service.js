"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationPipelineService = void 0;
const common_1 = require("@nestjs/common");
const did_service_1 = require("../did/did.service");
const sd_jwt_service_1 = require("../crypto/sd-jwt.service");
const trust_service_1 = require("../trust/trust.service");
const status_service_1 = require("../status/status.service");
const policy_engine_service_1 = require("./policy-engine.service");
let ValidationPipelineService = class ValidationPipelineService {
    didService;
    sdJwtService;
    trustService;
    statusService;
    policyEngine;
    constructor(didService, sdJwtService, trustService, statusService, policyEngine) {
        this.didService = didService;
        this.sdJwtService = sdJwtService;
        this.trustService = trustService;
        this.statusService = statusService;
        this.policyEngine = policyEngine;
    }
    async validatePresentation(vpToken, policies, nonce) {
        const credentials = [];
        const checks = {
            signature: { valid: true, error: undefined },
            expiration: { valid: true, error: undefined },
            status: { valid: true, error: undefined },
            trust: { valid: true, error: undefined },
            policy: { valid: true, error: undefined },
        };
        let sdJwtTokens;
        try {
            const parsed = JSON.parse(vpToken);
            sdJwtTokens = Array.isArray(parsed) ? parsed : [vpToken];
        }
        catch {
            sdJwtTokens = [vpToken];
        }
        for (const sdJwtVc of sdJwtTokens) {
            const decoded = this.sdJwtService.decode(sdJwtVc);
            const payload = decoded.payload;
            const issuerDid = payload.iss;
            const credentialType = payload.vct;
            // 1. Signature verification
            let issuerPublicKey;
            try {
                issuerPublicKey = await this.didService.getPublicKey(issuerDid);
                const sigResult = await this.sdJwtService.verify(sdJwtVc, issuerPublicKey);
                if (!sigResult.valid) {
                    checks.signature = { valid: false, error: sigResult.error || 'Signature verification failed' };
                }
            }
            catch (error) {
                checks.signature = {
                    valid: false,
                    error: error instanceof Error ? error.message : 'Could not verify signature',
                };
                continue;
            }
            // 2. Expiration check
            if (payload.exp) {
                const now = Math.floor(Date.now() / 1000);
                if (payload.exp < now) {
                    checks.expiration = { valid: false, error: 'Credential has expired' };
                }
            }
            // 3. Status check (revocation)
            const statusInfo = payload.status;
            if (statusInfo?.status_list) {
                const isActive = await this.statusService.checkStatus(statusInfo.status_list.uri, statusInfo.status_list.idx);
                if (!isActive) {
                    checks.status = { valid: false, error: 'Credential has been revoked' };
                }
            }
            // 4. Trust check
            const trustResult = await this.trustService.verifyTrust(issuerDid, credentialType);
            if (!trustResult.trusted) {
                checks.trust = { valid: false, error: trustResult.reason };
            }
            // 5. Policy evaluation
            const policyResult = await this.policyEngine.evaluatePolicies(policies, {
                trustResult,
                statusResult: checks.status,
                expirationResult: checks.expiration,
            });
            if (!policyResult.allPassed) {
                const failedPolicies = policyResult.results.filter((r) => !r.valid);
                checks.policy = {
                    valid: false,
                    error: failedPolicies.map((p) => `${p.policy}: ${p.error}`).join('; '),
                };
            }
            // Collect disclosed claims
            const disclosedClaims = {};
            for (const [key, value] of Object.entries(payload)) {
                if (!['iss', 'sub', 'iat', 'exp', 'vct', 'cnf', 'status', '_sd', '_sd_alg'].includes(key)) {
                    disclosedClaims[key] = value;
                }
            }
            credentials.push({
                credentialType,
                issuerDid,
                subjectDid: payload.sub,
                disclosedClaims,
                issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : new Date().toISOString(),
                expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
            });
        }
        const verified = checks.signature.valid &&
            checks.expiration.valid &&
            checks.status.valid &&
            checks.trust.valid &&
            checks.policy.valid;
        return { verified, checks, credentials };
    }
};
exports.ValidationPipelineService = ValidationPipelineService;
exports.ValidationPipelineService = ValidationPipelineService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [did_service_1.DidService,
        sd_jwt_service_1.SdJwtService,
        trust_service_1.TrustService,
        status_service_1.StatusService,
        policy_engine_service_1.PolicyEngineService])
], ValidationPipelineService);
//# sourceMappingURL=validation-pipeline.service.js.map