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
exports.ConsentService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
function withId(doc) {
    const { _id, ...rest } = doc;
    return { ...rest, id: _id.toString() };
}
let ConsentService = class ConsentService {
    db;
    constructor(db) {
        this.db = db;
    }
    async recordConsent(holderId, verifierDid, verifierName, credentialIds, disclosedClaims, purpose) {
        const created = await this.db.consentRecord.create({
            holderId,
            verifierDid,
            verifierName,
            credentialIds,
            disclosedClaims,
            purpose,
        });
        return withId(created.toObject());
    }
    async getConsentHistory(holderId) {
        const records = await this.db.consentRecord
            .find({ holderId })
            .sort({ consentGivenAt: -1 })
            .lean();
        return records.map((r) => withId(r));
    }
};
exports.ConsentService = ConsentService;
exports.ConsentService = ConsentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ConsentService);
//# sourceMappingURL=consent.service.js.map