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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const rxjs_1 = require("rxjs");
const verifier_service_1 = require("./verifier.service");
const verification_events_service_1 = require("./verification-events.service");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
class CreatePresentationRequestDto {
    verifierDid;
    credentialTypes;
    requiredClaims;
    policies;
    verifierName;
    purpose;
}
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'did:key:zVerifier...' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePresentationRequestDto.prototype, "verifierDid", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: ['VerifiableEducationCredential'] }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreatePresentationRequestDto.prototype, "credentialTypes", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: { education: ['degree', 'institution'] } }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePresentationRequestDto.prototype, "requiredClaims", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: ['require-trusted-issuer', 'require-active-status'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreatePresentationRequestDto.prototype, "policies", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Acme University' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePresentationRequestDto.prototype, "verifierName", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Verify education credentials for enrollment' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePresentationRequestDto.prototype, "purpose", void 0);
class PresentationResponseDto {
    vp_token;
    presentation_submission;
    state;
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PresentationResponseDto.prototype, "vp_token", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PresentationResponseDto.prototype, "presentation_submission", void 0);
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PresentationResponseDto.prototype, "state", void 0);
class UpdatePolicyDto {
    enabled;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdatePolicyDto.prototype, "enabled", void 0);
class CreatePolicyDto {
    name;
    description;
    rules;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'custom-policy' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePolicyDto.prototype, "name", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Custom verification policy' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePolicyDto.prototype, "description", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: { customRule: { required: true } } }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePolicyDto.prototype, "rules", void 0);
let VerifierController = class VerifierController {
    verifierService;
    verificationEvents;
    constructor(verifierService, verificationEvents) {
        this.verifierService = verifierService;
        this.verificationEvents = verificationEvents;
    }
    async createRequest(dto, user) {
        const verifierDid = dto.verifierDid || `did:user:${user.id}`;
        const verifierName = dto.verifierName || user.name;
        const result = await this.verifierService.createPresentationRequest(verifierDid, dto.credentialTypes, dto.requiredClaims, dto.policies, verifierName, dto.purpose);
        return {
            data: {
                requestId: result.requestId,
                requestUri: result.authorizationRequestUri,
                shareUrl: result.shareUrl,
                nonce: result.nonce,
                state: result.state,
            },
        };
    }
    async handleResponse(dto) {
        const result = await this.verifierService.handlePresentationResponse(dto.vp_token, dto.state);
        return { data: result };
    }
    async listPresentations(user) {
        const verifierDid = user.role === 'admin' ? undefined : `did:user:${user.id}`;
        const presentations = await this.verifierService.listPresentations(verifierDid);
        return { data: presentations };
    }
    async getPresentation(id) {
        const presentation = await this.verifierService.getPresentation(id);
        return { data: presentation };
    }
    async getRequestDetails(id) {
        const details = await this.verifierService.getRequestDetails(id);
        return { data: details };
    }
    streamPresentation(id) {
        return this.verificationEvents.subscribe(id);
    }
    async createPolicy(dto) {
        const policy = await this.verifierService.createPolicy(dto.name, dto.description, dto.rules);
        return { data: policy };
    }
    async listPolicies() {
        const policies = await this.verifierService.listPolicies();
        return { data: policies };
    }
    async updatePolicy(id, dto) {
        const policy = await this.verifierService.updatePolicy(id, dto.enabled);
        return { data: policy };
    }
};
exports.VerifierController = VerifierController;
__decorate([
    (0, common_1.Post)('presentations/request'),
    (0, roles_decorator_1.Roles)('verifier', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create presentation request (OID4VP)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Presentation request created' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — requires verifier or admin role' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePresentationRequestDto, Object]),
    __metadata("design:returntype", Promise)
], VerifierController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Post)('presentations/response'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Submit presentation response (OID4VP — from wallet)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification result' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PresentationResponseDto]),
    __metadata("design:returntype", Promise)
], VerifierController.prototype, "handleResponse", null);
__decorate([
    (0, common_1.Get)('presentations'),
    (0, roles_decorator_1.Roles)('verifier', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List verification results (scoped to current verifier, admin sees all)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of verification results' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VerifierController.prototype, "listPresentations", null);
__decorate([
    (0, common_1.Get)('presentations/:id'),
    (0, roles_decorator_1.Roles)('verifier', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get presentation/verification result' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VerifierController.prototype, "getPresentation", null);
__decorate([
    (0, common_1.Get)('presentations/:id/details'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get public verification request details (for shareable link)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Verification request details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VerifierController.prototype, "getRequestDetails", null);
__decorate([
    (0, common_1.Sse)('presentations/:id/stream'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'SSE stream for real-time verification result updates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Server-Sent Events stream' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", rxjs_1.Observable)
], VerifierController.prototype, "streamPresentation", null);
__decorate([
    (0, common_1.Post)('policies'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create verifier policy' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Policy created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePolicyDto]),
    __metadata("design:returntype", Promise)
], VerifierController.prototype, "createPolicy", null);
__decorate([
    (0, common_1.Get)('policies'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'List verifier policies' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of policies' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VerifierController.prototype, "listPolicies", null);
__decorate([
    (0, common_1.Put)('policies/:id'),
    (0, roles_decorator_1.Roles)('verifier', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update verifier policy (enable/disable)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Policy updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Policy not found' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdatePolicyDto]),
    __metadata("design:returntype", Promise)
], VerifierController.prototype, "updatePolicy", null);
exports.VerifierController = VerifierController = __decorate([
    (0, swagger_1.ApiTags)('Verifier'),
    (0, common_1.Controller)('verifier'),
    __metadata("design:paramtypes", [verifier_service_1.VerifierService,
        verification_events_service_1.VerificationEventsService])
], VerifierController);
//# sourceMappingURL=verifier.controller.js.map