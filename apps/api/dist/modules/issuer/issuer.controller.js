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
exports.IssuerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const issuer_service_1 = require("./issuer.service");
const create_offer_dto_1 = require("./dto/create-offer.dto");
const bulk_offer_dto_1 = require("./dto/bulk-offer.dto");
const token_request_dto_1 = require("./dto/token-request.dto");
const credential_request_dto_1 = require("./dto/credential-request.dto");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let IssuerController = class IssuerController {
    issuerService;
    constructor(issuerService) {
        this.issuerService = issuerService;
    }
    async getMetadata() {
        const metadata = await this.issuerService.getIssuerMetadata();
        return { data: metadata };
    }
    async createOffer(dto, req) {
        const result = await this.issuerService.createOffer(dto.schemaTypeUri, dto.subjectDid || 'pending', dto.claims, dto.pinRequired, req.user?.id);
        return { data: result };
    }
    async createBulkOffers(dto, req) {
        const result = await this.issuerService.createBulkOffers(dto.schemaTypeUri, dto.offers, req.user?.id);
        return { data: result };
    }
    async exchangeToken(dto) {
        if (dto.grant_type !== 'urn:ietf:params:oauth:grant-type:pre-authorized_code') {
            throw new common_1.BadRequestException('Only pre-authorized_code grant type is supported');
        }
        const result = await this.issuerService.exchangeToken(dto['pre-authorized_code'], dto.pin);
        return { data: result };
    }
    async issueCredential(authHeader, dto) {
        const accessToken = authHeader?.replace('Bearer ', '');
        if (!accessToken) {
            throw new common_1.UnauthorizedException('Missing access token');
        }
        const result = await this.issuerService.issueCredential(accessToken, dto.format, dto.credential_definition, dto.proof);
        return { data: result };
    }
    async listOffers() {
        const offers = await this.issuerService.listOffers();
        return { data: offers };
    }
    async listSchemas() {
        const schemas = await this.issuerService.listSchemas();
        return { data: schemas };
    }
    async getSchema(id) {
        const schema = await this.issuerService.getSchema(id);
        return { data: schema };
    }
    async getOfferPreview(code) {
        const preview = await this.issuerService.getOfferPreview(code);
        return { data: preview };
    }
    async listCredentials() {
        const credentials = await this.issuerService.listIssuedCredentials();
        return { data: credentials };
    }
};
exports.IssuerController = IssuerController;
__decorate([
    (0, common_1.Get)('.well-known/openid-credential-issuer'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get issuer metadata (OID4VCI)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Issuer metadata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "getMetadata", null);
__decorate([
    (0, common_1.Post)('offers'),
    (0, roles_decorator_1.Roles)('issuer', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create credential offer' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Credential offer created' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — requires issuer or admin role' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_offer_dto_1.CreateOfferDto, Object]),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "createOffer", null);
__decorate([
    (0, common_1.Post)('offers/batch'),
    (0, roles_decorator_1.Roles)('issuer', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create multiple credential offers in batch (bulk issuance)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Batch offers created' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [bulk_offer_dto_1.CreateBulkOffersDto, Object]),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "createBulkOffers", null);
__decorate([
    (0, common_1.Post)('token'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Exchange pre-authorized code for access token (OID4VCI)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token response' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [token_request_dto_1.TokenRequestDto]),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "exchangeToken", null);
__decorate([
    (0, common_1.Post)('credential'),
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Issue verifiable credential (OID4VCI)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credential issued' }),
    __param(0, (0, common_1.Headers)('authorization')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, credential_request_dto_1.CredentialRequestDto]),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "issueCredential", null);
__decorate([
    (0, common_1.Get)('offers'),
    (0, roles_decorator_1.Roles)('issuer', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List all credential offers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of credential offers with status and URIs' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "listOffers", null);
__decorate([
    (0, common_1.Get)('schemas'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'List credential schemas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of credential schemas' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "listSchemas", null);
__decorate([
    (0, common_1.Get)('schemas/:id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get credential schema by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credential schema details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "getSchema", null);
__decorate([
    (0, common_1.Get)('offers/preview/:code'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Preview a credential offer by pre-authorized code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Offer preview with claims and issuer info' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Offer not found' }),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "getOfferPreview", null);
__decorate([
    (0, common_1.Get)('credentials'),
    (0, roles_decorator_1.Roles)('issuer', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'List issued credentials' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of issued credentials' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], IssuerController.prototype, "listCredentials", null);
exports.IssuerController = IssuerController = __decorate([
    (0, swagger_1.ApiTags)('Issuer'),
    (0, common_1.Controller)('issuer'),
    __metadata("design:paramtypes", [issuer_service_1.IssuerService])
], IssuerController);
//# sourceMappingURL=issuer.controller.js.map