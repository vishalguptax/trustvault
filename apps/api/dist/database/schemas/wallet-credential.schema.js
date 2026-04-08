"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletCredentialSchema = exports.WalletCredentialModel = void 0;
const mongoose_1 = require("mongoose");
const WalletCredentialSchema = new mongoose_1.Schema({
    holderId: { type: String, required: true, index: true },
    rawCredential: { type: String, required: true },
    format: { type: String, required: true },
    credentialType: { type: String, required: true, index: true },
    issuerDid: { type: String, required: true },
    claims: { type: mongoose_1.Schema.Types.Mixed, required: true },
    sdClaims: { type: [String], default: [] },
    issuedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'wallet_credentials' });
exports.WalletCredentialSchema = WalletCredentialSchema;
exports.WalletCredentialModel = (0, mongoose_1.model)('WalletCredential', WalletCredentialSchema);
//# sourceMappingURL=wallet-credential.schema.js.map