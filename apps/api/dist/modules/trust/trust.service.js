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
exports.TrustService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
function withId(doc) {
    const { _id, ...rest } = doc;
    return { ...rest, id: _id.toString() };
}
let TrustService = class TrustService {
    db;
    constructor(db) {
        this.db = db;
    }
    async registerIssuer(did, name, credentialTypes, description) {
        const existing = await this.db.trustedIssuer.findOne({ did }).lean();
        if (existing) {
            throw new common_1.ConflictException(`Issuer already registered: ${did}`);
        }
        const created = await this.db.trustedIssuer.create({
            did, name, credentialTypes, description, status: 'active',
        });
        return withId(created.toObject());
    }
    async listIssuers() {
        const records = await this.db.trustedIssuer.find({}).sort({ createdAt: -1 }).lean();
        return records.map((r) => withId(r));
    }
    async getIssuer(did) {
        const issuer = await this.db.trustedIssuer.findOne({ did }).lean();
        if (!issuer) {
            return { trusted: false, issuer: null };
        }
        return { trusted: issuer.status === 'active', issuer: withId(issuer) };
    }
    async updateIssuer(did, updates) {
        const issuer = await this.db.trustedIssuer.findOne({ did }).lean();
        if (!issuer) {
            throw new common_1.NotFoundException(`Issuer not found: ${did}`);
        }
        await this.db.trustedIssuer.updateOne({ did }, { $set: updates });
        return { updated: true };
    }
    async removeIssuer(did) {
        const issuer = await this.db.trustedIssuer.findOne({ did }).lean();
        if (!issuer) {
            throw new common_1.NotFoundException(`Issuer not found: ${did}`);
        }
        await this.db.trustedIssuer.deleteOne({ did });
        return { removed: true };
    }
    /** Link a user account to a trusted issuer entry */
    async linkUserToIssuer(email, trustedIssuerId) {
        await this.db.user.updateOne({ email }, { $set: { trustedIssuerId } });
    }
    /** Get the trusted issuer entry for a user by their trustedIssuerId */
    async getIssuerForUser(trustedIssuerId) {
        const result = await this.db.trustedIssuer.findById(trustedIssuerId).lean();
        return result ? withId(result) : null;
    }
    async verifyTrust(issuerDid, credentialType) {
        const issuer = await this.db.trustedIssuer.findOne({ did: issuerDid }).lean();
        if (!issuer) {
            return { trusted: false, reason: 'Issuer not found in trust registry' };
        }
        if (issuer.status !== 'active') {
            return { trusted: false, reason: `Issuer status is ${issuer.status}` };
        }
        if (!issuer.credentialTypes.includes(credentialType)) {
            return {
                trusted: false,
                reason: `Issuer not authorized to issue ${credentialType}`,
            };
        }
        return { trusted: true };
    }
};
exports.TrustService = TrustService;
exports.TrustService = TrustService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], TrustService);
//# sourceMappingURL=trust.service.js.map