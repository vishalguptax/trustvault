"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustedIssuerSchema = exports.TrustedIssuerModel = void 0;
const mongoose_1 = require("mongoose");
const TrustedIssuerSchema = new mongoose_1.Schema({
    did: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    logoUrl: { type: String, default: null },
    website: { type: String, default: null },
    credentialTypes: { type: [String], default: [] },
    status: { type: String, default: 'active' },
    registeredBy: { type: String, default: null },
}, { timestamps: true, collection: 'trusted_issuers' });
exports.TrustedIssuerSchema = TrustedIssuerSchema;
exports.TrustedIssuerModel = (0, mongoose_1.model)('TrustedIssuer', TrustedIssuerSchema);
//# sourceMappingURL=trusted-issuer.schema.js.map