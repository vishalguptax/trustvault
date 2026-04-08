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
exports.VerifierService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const database_service_1 = require("../../database/database.service");
const validation_pipeline_service_1 = require("./validation-pipeline.service");
const verification_events_service_1 = require("./verification-events.service");
let VerifierService = class VerifierService {
    db;
    validationPipeline;
    configService;
    verificationEvents;
    constructor(db, validationPipeline, configService, verificationEvents) {
        this.db = db;
        this.validationPipeline = validationPipeline;
        this.configService = configService;
        this.verificationEvents = verificationEvents;
    }
    async createPresentationRequest(verifierDid, credentialTypes, requiredClaims, policies, verifierName, purpose) {
        const nonce = (0, crypto_1.randomBytes)(16).toString('base64url');
        const state = (0, crypto_1.randomBytes)(16).toString('base64url');
        const presentationDefinition = {
            id: `pd-${state}`,
            input_descriptors: credentialTypes.map((type, index) => ({
                id: `descriptor-${index}`,
                format: { 'vc+sd-jwt': { alg: ['ES256'] } },
                constraints: {
                    fields: [
                        { path: ['$.vct'], filter: { type: 'string', const: type } },
                        ...(requiredClaims?.[type] || []).map((claim) => ({
                            path: [`$.${claim}`],
                        })),
                    ],
                },
            })),
        };
        const request = await this.db.verificationRequest.create({
            verifierDid,
            verifierName: verifierName ?? null,
            purpose: purpose ?? null,
            presentationDefinition,
            nonce,
            state,
            requiredCredentialTypes: credentialTypes,
            policies: policies || ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
            status: 'pending',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        const requestId = request._id.toString();
        const apiBaseUrl = this.configService.get('apiBaseUrl');
        const requestUri = `${apiBaseUrl}/verifier/presentations/${requestId}`;
        const uriParams = new URLSearchParams();
        uriParams.set('request_uri', requestUri);
        uriParams.set('nonce', nonce);
        uriParams.set('verifier_did', verifierDid);
        uriParams.set('credential_types', credentialTypes.join(','));
        if (verifierName) {
            uriParams.set('verifier_name', verifierName);
        }
        if (purpose) {
            uriParams.set('purpose', purpose);
        }
        const authorizationRequestUri = `openid4vp://?${uriParams.toString()}`;
        const webAppUrl = this.configService.get('webAppUrl') ?? 'http://localhost:3000';
        const shareUrl = `${webAppUrl}/verify/${requestId}`;
        return {
            requestId,
            authorizationRequestUri,
            shareUrl,
            nonce,
            state,
        };
    }
    /** Public-facing request details for the shareable verification page */
    async getRequestDetails(id) {
        const request = await this.db.verificationRequest.findById(id).lean();
        if (!request) {
            throw new common_1.NotFoundException(`Verification request not found: ${id}`);
        }
        const requestId = request._id.toString();
        const apiBaseUrl = this.configService.get('apiBaseUrl');
        const requestUri = `${apiBaseUrl}/verifier/presentations/${requestId}`;
        // Rebuild the openid4vp:// URI for the share page
        const uriParams = new URLSearchParams();
        uriParams.set('request_uri', requestUri);
        uriParams.set('nonce', request.nonce);
        if (request.verifierDid)
            uriParams.set('verifier_did', request.verifierDid);
        uriParams.set('credential_types', request.requiredCredentialTypes.join(','));
        if (request.verifierName)
            uriParams.set('verifier_name', request.verifierName);
        if (request.purpose)
            uriParams.set('purpose', request.purpose);
        const walletUri = `openid4vp://?${uriParams.toString()}`;
        return {
            id: requestId,
            credentialTypes: request.requiredCredentialTypes,
            verifierName: request.verifierName ?? 'Verifier',
            purpose: request.purpose ?? 'Credential verification',
            requestUri: walletUri,
            status: request.status,
            expiresAt: request.expiresAt?.toISOString() ?? null,
        };
    }
    async handlePresentationResponse(vpToken, state) {
        const request = await this.db.verificationRequest.findOne({ state }).lean();
        if (!request) {
            throw new common_1.NotFoundException(`Verification request not found for state: ${state}`);
        }
        const result = await this.validationPipeline.validatePresentation(vpToken, request.policies, request.nonce);
        const completedAt = new Date();
        const status = result.verified ? 'verified' : 'rejected';
        const requestId = request._id.toString();
        await this.db.verificationRequest.findByIdAndUpdate(request._id, {
            $set: {
                status,
                result: JSON.parse(JSON.stringify(result)),
                completedAt,
            },
        }, { new: true }).lean();
        // Emit SSE event so the verifier's browser updates in real-time
        this.verificationEvents.emit({
            requestId,
            verificationId: requestId,
            status: status,
            result: result.checks ?? {},
            completedAt: completedAt.toISOString(),
        });
        return {
            verificationId: requestId,
            status,
            result,
        };
    }
    async listPresentations(verifierDid) {
        const where = verifierDid ? { verifierDid } : {};
        const requests = await this.db.verificationRequest.find(where).sort({ createdAt: -1 }).lean();
        return requests.map((r) => ({
            id: r._id.toString(),
            credentialTypes: r.requiredCredentialTypes,
            result: r.status === 'verified' ? 'verified' : r.status === 'rejected' ? 'rejected' : 'pending',
            verifierDid: r.verifierDid,
            createdAt: r.createdAt,
            completedAt: r.completedAt,
        }));
    }
    async getPresentation(id) {
        const request = await this.db.verificationRequest.findById(id).lean();
        if (!request) {
            throw new common_1.NotFoundException(`Verification request not found: ${id}`);
        }
        const requestId = request._id.toString();
        // Map stored ValidationResult to the shape the frontend expects
        const rawResult = request.result;
        const rawChecks = (rawResult?.checks ?? {});
        const rawCredentials = (rawResult?.credentials ?? []);
        const checks = Object.entries(rawChecks).map(([name, check]) => ({
            name,
            label: name.charAt(0).toUpperCase() + name.slice(1),
            passed: check.valid,
        }));
        const credentials = rawCredentials.map((cred) => ({
            type: cred.credentialType ?? 'Unknown',
            issuerDid: cred.issuerDid ?? '',
            subjectDid: cred.subjectDid ?? '',
            disclosedClaims: Object.entries(cred.disclosedClaims ?? {}).map(([key, value]) => ({
                key,
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
                value: String(value),
            })),
        }));
        const isVerified = rawResult?.verified === true;
        return {
            id: requestId,
            result: isVerified ? 'verified' : request.status === 'pending' ? 'pending' : 'rejected',
            checks,
            credentials,
            verifierDid: request.verifierDid,
            nonce: request.nonce,
            timestamp: request.completedAt?.toISOString() ?? request.createdAt.toISOString(),
            policies: request.policies,
        };
    }
    async createPolicy(name, description, rules) {
        const policy = await this.db.verifierPolicy.create({
            name,
            description,
            rules: JSON.parse(JSON.stringify(rules)),
            active: true,
        });
        const doc = policy.toObject();
        const { _id, ...rest } = doc;
        return { ...rest, id: _id.toString() };
    }
    async listPolicies() {
        const policies = await this.db.verifierPolicy.find({ active: true }).lean();
        return policies.map((p) => { const { _id, ...rest } = p; return { ...rest, id: _id.toString() }; });
    }
    async updatePolicy(id, enabled) {
        const policy = await this.db.verifierPolicy.findById(id).lean();
        if (!policy) {
            throw new common_1.NotFoundException(`Policy not found: ${id}`);
        }
        const updated = await this.db.verifierPolicy.findByIdAndUpdate(id, { $set: { active: enabled } }, { new: true }).lean();
        if (!updated) {
            throw new common_1.NotFoundException(`Policy not found: ${id}`);
        }
        const { _id: uid, ...urest } = updated;
        return { ...urest, id: uid.toString() };
    }
};
exports.VerifierService = VerifierService;
exports.VerifierService = VerifierService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        validation_pipeline_service_1.ValidationPipelineService,
        config_1.ConfigService,
        verification_events_service_1.VerificationEventsService])
], VerifierService);
//# sourceMappingURL=verifier.service.js.map