"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialOfferSchema = exports.CredentialOfferModel = void 0;
const mongoose_1 = require("mongoose");
const CredentialOfferSchema = new mongoose_1.Schema({
    issuerDid: { type: String, required: true },
    schemaTypeUri: { type: String, required: true },
    preAuthorizedCode: { type: String, required: true, unique: true },
    pinRequired: { type: Boolean, default: false },
    pinHash: { type: String, default: null },
    claims: { type: mongoose_1.Schema.Types.Mixed, required: true },
    accessToken: { type: String, default: null },
    cNonce: { type: String, default: null },
    status: { type: String, default: 'pending' },
    expiresAt: { type: Date, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'credential_offers' });
exports.CredentialOfferSchema = CredentialOfferSchema;
exports.CredentialOfferModel = (0, mongoose_1.model)('CredentialOffer', CredentialOfferSchema);
//# sourceMappingURL=credential-offer.schema.js.map