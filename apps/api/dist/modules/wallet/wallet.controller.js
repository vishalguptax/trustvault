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
exports.WalletController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const wallet_service_1 = require("./wallet.service");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
class ReceiveCredentialDto {
    credentialOfferUri;
    holderId;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'openid-credential-offer://...' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveCredentialDto.prototype, "credentialOfferUri", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'user-1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReceiveCredentialDto.prototype, "holderId", void 0);
class CreatePresentationDto {
    verificationRequestId;
    holderId;
    selectedCredentials;
    disclosedClaims;
    consent;
}
__decorate([
    (0, swagger_2.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePresentationDto.prototype, "verificationRequestId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'user-1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePresentationDto.prototype, "holderId", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: ['cred-id-1'] }),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreatePresentationDto.prototype, "selectedCredentials", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: { 'cred-id-1': ['degree', 'institution'] } }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreatePresentationDto.prototype, "disclosedClaims", void 0);
__decorate([
    (0, swagger_2.ApiProperty)({ example: true }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreatePresentationDto.prototype, "consent", void 0);
class CreateWalletDidDto {
    holderId;
    method;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: 'user-1' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWalletDidDto.prototype, "holderId", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'key' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWalletDidDto.prototype, "method", void 0);
let WalletController = class WalletController {
    walletService;
    constructor(walletService) {
        this.walletService = walletService;
    }
    async receiveCredential(dto) {
        const result = await this.walletService.receiveCredential(dto.credentialOfferUri, dto.holderId);
        return { data: result };
    }
    async listCredentials(holderId) {
        const result = await this.walletService.listCredentials(holderId);
        return { data: result };
    }
    async getCredential(id) {
        const credential = await this.walletService.getCredential(id);
        return { data: credential };
    }
    async getCredentialClaims(id) {
        const claims = await this.walletService.getCredentialClaims(id);
        return { data: claims };
    }
    async deleteCredential(id) {
        const result = await this.walletService.deleteCredential(id);
        return { data: result };
    }
    async createPresentation(dto) {
        const result = await this.walletService.createPresentation(dto.verificationRequestId, dto.holderId, dto.selectedCredentials, dto.disclosedClaims, dto.consent);
        return { data: result };
    }
    async getConsentHistory(holderId) {
        const records = await this.walletService.getConsentHistory(holderId);
        return { data: records };
    }
    async createDid(dto) {
        const result = await this.walletService.createHolderDid(dto.holderId, dto.method);
        return { data: result };
    }
};
exports.WalletController = WalletController;
__decorate([
    (0, common_1.Post)('credentials/receive'),
    (0, swagger_1.ApiOperation)({ summary: 'Receive credential via OID4VCI' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Credential received and stored' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid credential offer' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReceiveCredentialDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "receiveCredential", null);
__decorate([
    (0, common_1.Get)('credentials'),
    (0, swagger_1.ApiOperation)({ summary: 'List wallet credentials' }),
    (0, swagger_1.ApiQuery)({ name: 'holderId', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of credentials' }),
    __param(0, (0, common_1.Query)('holderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "listCredentials", null);
__decorate([
    (0, common_1.Get)('credentials/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get credential details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credential details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Credential not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getCredential", null);
__decorate([
    (0, common_1.Get)('credentials/:id/claims'),
    (0, swagger_1.ApiOperation)({ summary: 'Get credential claims (fixed/selective)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credential claims' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getCredentialClaims", null);
__decorate([
    (0, common_1.Delete)('credentials/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete credential from wallet' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credential deleted' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "deleteCredential", null);
__decorate([
    (0, common_1.Post)('presentations/create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create verifiable presentation' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Presentation created' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Consent required or invalid data' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreatePresentationDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "createPresentation", null);
__decorate([
    (0, common_1.Get)('consent/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get consent history' }),
    (0, swagger_1.ApiQuery)({ name: 'holderId', required: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Consent records' }),
    __param(0, (0, common_1.Query)('holderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "getConsentHistory", null);
__decorate([
    (0, common_1.Post)('dids'),
    (0, swagger_1.ApiOperation)({ summary: 'Create wallet DID' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'DID created' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateWalletDidDto]),
    __metadata("design:returntype", Promise)
], WalletController.prototype, "createDid", null);
exports.WalletController = WalletController = __decorate([
    (0, swagger_1.ApiTags)('Wallet'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('wallet'),
    (0, roles_decorator_1.Roles)('holder', 'admin'),
    __metadata("design:paramtypes", [wallet_service_1.WalletService])
], WalletController);
//# sourceMappingURL=wallet.controller.js.map