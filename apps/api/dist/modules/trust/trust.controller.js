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
exports.TrustController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const trust_service_1 = require("./trust.service");
const issuer_service_1 = require("../issuer/issuer.service");
const auth_service_1 = require("../auth/auth.service");
const did_service_1 = require("../did/did.service");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
class RegisterIssuerDto {
    did;
    name;
    credentialTypes;
    description;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'did:key:z...' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterIssuerDto.prototype, "did", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'TrustBank India' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterIssuerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: ['VerifiableIncomeCredential'] }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], RegisterIssuerDto.prototype, "credentialTypes", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Licensed bank for income verification' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterIssuerDto.prototype, "description", void 0);
class OnboardUserDto {
    name;
    email;
    role;
    credentialTypes;
    description;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'Sandhya Sharma' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardUserDto.prototype, "name", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'sandhya@example.com' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'issuer' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardUserDto.prototype, "role", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: ['VerifiableEducationCredential'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], OnboardUserDto.prototype, "credentialTypes", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'University issuing education credentials' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OnboardUserDto.prototype, "description", void 0);
class UpdateIssuerDto {
    name;
    credentialTypes;
    status;
}
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIssuerDto.prototype, "name", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateIssuerDto.prototype, "credentialTypes", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'active' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateIssuerDto.prototype, "status", void 0);
let TrustController = class TrustController {
    trustService;
    issuerService;
    authService;
    didService;
    configService;
    constructor(trustService, issuerService, authService, didService, configService) {
        this.trustService = trustService;
        this.issuerService = issuerService;
        this.authService = authService;
        this.didService = didService;
        this.configService = configService;
    }
    async listSchemas() {
        const schemas = await this.issuerService.listSchemas();
        return { data: schemas };
    }
    async listIssuers() {
        const issuers = await this.trustService.listIssuers();
        return { data: issuers };
    }
    async getMyIssuer(req) {
        const user = req.user;
        if (!user?.trustedIssuerId) {
            return { data: { authorized: false, credentialTypes: [], issuer: null } };
        }
        const issuer = await this.trustService.getIssuerForUser(user.trustedIssuerId);
        if (!issuer) {
            return { data: { authorized: false, credentialTypes: [], issuer: null } };
        }
        return {
            data: {
                authorized: issuer.status === 'active',
                credentialTypes: issuer.credentialTypes,
                issuer: { did: issuer.did, name: issuer.name, description: issuer.description },
            },
        };
    }
    async getIssuer(did) {
        const issuer = await this.trustService.getIssuer(decodeURIComponent(did));
        return { data: issuer };
    }
    async registerIssuer(dto) {
        const issuer = await this.trustService.registerIssuer(dto.did, dto.name, dto.credentialTypes, dto.description);
        return { data: issuer };
    }
    async updateIssuer(did, dto) {
        const result = await this.trustService.updateIssuer(decodeURIComponent(did), dto);
        return { data: result };
    }
    async removeIssuer(did) {
        const result = await this.trustService.removeIssuer(decodeURIComponent(did));
        return { data: result };
    }
    async onboardUser(dto) {
        const webAppUrl = this.configService.get('webAppUrl');
        const loginUrl = `${webAppUrl}/login`;
        // Create user account with temporary password
        const userResult = await this.authService.createUser(dto.email, dto.name, dto.role, loginUrl);
        // For issuers, auto-generate a DID and register in trust registry
        let issuer = null;
        let generatedDid = null;
        if (dto.role === 'issuer' && dto.credentialTypes && dto.credentialTypes.length > 0) {
            const didResult = await this.didService.createDid('key');
            generatedDid = didResult.did;
            issuer = await this.trustService.registerIssuer(didResult.did, dto.name, dto.credentialTypes, dto.description);
            // Link the user account to the trusted issuer entry
            await this.trustService.linkUserToIssuer(userResult.email, issuer.id);
        }
        return {
            data: {
                user: { email: userResult.email, name: userResult.name, role: userResult.role },
                temporaryPassword: userResult.temporaryPassword,
                did: generatedDid,
                issuer,
            },
        };
    }
    async verifyTrust(issuerDid, credentialType) {
        const result = await this.trustService.verifyTrust(issuerDid, credentialType);
        return { data: result };
    }
};
exports.TrustController = TrustController;
__decorate([
    (0, common_1.Get)('schemas'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'List credential schemas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of credential schemas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "listSchemas", null);
__decorate([
    (0, common_1.Get)('issuers'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'List trusted issuers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of trusted issuers' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "listIssuers", null);
__decorate([
    (0, common_1.Get)('issuers/me'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)('issuer', 'admin'),
    (0, swagger_1.ApiOperation)({ summary: 'Get the current user\'s trusted issuer entry and authorized credential types' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Issuer authorization details' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "getMyIssuer", null);
__decorate([
    (0, common_1.Get)('issuers/:did'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get trusted issuer by DID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Issuer details' }),
    __param(0, (0, common_1.Param)('did')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "getIssuer", null);
__decorate([
    (0, common_1.Post)('issuers'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register trusted issuer' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Issuer registered' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — requires admin role' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Issuer already registered' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RegisterIssuerDto]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "registerIssuer", null);
__decorate([
    (0, common_1.Put)('issuers/:did'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update trusted issuer' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Issuer updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Issuer not found' }),
    __param(0, (0, common_1.Param)('did')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateIssuerDto]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "updateIssuer", null);
__decorate([
    (0, common_1.Delete)('issuers/:did'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Remove trusted issuer' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Issuer removed' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Issuer not found' }),
    __param(0, (0, common_1.Param)('did')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "removeIssuer", null);
__decorate([
    (0, common_1.Post)('onboard'),
    (0, roles_decorator_1.Roles)('admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Onboard a new issuer or verifier (creates user account + trust registry entry + sends credentials via email)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User onboarded successfully' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Email or DID already exists' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [OnboardUserDto]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "onboardUser", null);
__decorate([
    (0, common_1.Get)('verify'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verify issuer trust for credential type' }),
    (0, swagger_1.ApiQuery)({ name: 'issuerDid', required: true }),
    (0, swagger_1.ApiQuery)({ name: 'credentialType', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trust verification result' }),
    __param(0, (0, common_1.Query)('issuerDid')),
    __param(1, (0, common_1.Query)('credentialType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], TrustController.prototype, "verifyTrust", null);
exports.TrustController = TrustController = __decorate([
    (0, swagger_1.ApiTags)('Trust Registry'),
    (0, common_1.Controller)('trust'),
    __metadata("design:paramtypes", [trust_service_1.TrustService,
        issuer_service_1.IssuerService,
        auth_service_1.AuthService,
        did_service_1.DidService,
        config_1.ConfigService])
], TrustController);
//# sourceMappingURL=trust.controller.js.map