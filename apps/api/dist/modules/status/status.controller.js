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
exports.StatusController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const swagger_2 = require("@nestjs/swagger");
const status_service_1 = require("./status.service");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
class RevokeDto {
    credentialId;
    reason;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: '507f1f77bcf86cd799439011' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RevokeDto.prototype, "credentialId", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Credential compromised' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RevokeDto.prototype, "reason", void 0);
class SuspendDto {
    credentialId;
    reason;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: '507f1f77bcf86cd799439011' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuspendDto.prototype, "credentialId", void 0);
__decorate([
    (0, swagger_2.ApiPropertyOptional)({ example: 'Under investigation' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SuspendDto.prototype, "reason", void 0);
class ReinstateDto {
    credentialId;
}
__decorate([
    (0, swagger_2.ApiProperty)({ example: '507f1f77bcf86cd799439011' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReinstateDto.prototype, "credentialId", void 0);
let StatusController = class StatusController {
    statusService;
    constructor(statusService) {
        this.statusService = statusService;
    }
    async getStatusList(id) {
        const result = await this.statusService.getStatusList(id);
        return { data: result };
    }
    async revoke(dto) {
        const result = await this.statusService.revokeCredential(dto.credentialId, dto.reason);
        return { data: result };
    }
    async suspend(dto) {
        const result = await this.statusService.suspendCredential(dto.credentialId, dto.reason);
        return { data: result };
    }
    async reinstate(dto) {
        const result = await this.statusService.reinstateCredential(dto.credentialId);
        return { data: result };
    }
};
exports.StatusController = StatusController;
__decorate([
    (0, common_1.Get)('lists/:id'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get Bitstring Status List credential (W3C format)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Status list credential' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Status list not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "getStatusList", null);
__decorate([
    (0, common_1.Post)('revoke'),
    (0, roles_decorator_1.Roles)('issuer', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke a credential' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credential revoked' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — requires issuer or admin role' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Credential not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [RevokeDto]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "revoke", null);
__decorate([
    (0, common_1.Post)('suspend'),
    (0, roles_decorator_1.Roles)('issuer', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend a credential' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credential suspended' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — requires issuer or admin role' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Credential not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [SuspendDto]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "suspend", null);
__decorate([
    (0, common_1.Post)('reinstate'),
    (0, roles_decorator_1.Roles)('issuer', 'admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reinstate a suspended credential' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Credential reinstated' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: 'Forbidden — requires issuer or admin role' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Credential not found' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ReinstateDto]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "reinstate", null);
exports.StatusController = StatusController = __decorate([
    (0, swagger_1.ApiTags)('Status'),
    (0, common_1.Controller)('status'),
    __metadata("design:paramtypes", [status_service_1.StatusService])
], StatusController);
//# sourceMappingURL=status.controller.js.map