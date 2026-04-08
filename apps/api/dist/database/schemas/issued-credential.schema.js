"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuedCredentialSchema = exports.IssuedCredentialModel = void 0;
const mongoose_1 = require("mongoose");
const IssuedCredentialSchema = new mongoose_1.Schema({
    issuerDid: { type: String, required: true, index: true },
    subjectDid: { type: String, required: true, index: true },
    schemaTypeUri: { type: String, required: true },
    credentialHash: { type: String, required: true, unique: true },
    statusListId: { type: String, default: null },
    statusListIndex: { type: Number, default: null },
    status: { type: String, default: 'active', index: true },
    expiresAt: { type: Date, default: null },
    issuedAt: { type: Date, default: Date.now },
    metadata: { type: mongoose_1.Schema.Types.Mixed, default: null },
}, { collection: 'issued_credentials' });
exports.IssuedCredentialSchema = IssuedCredentialSchema;
exports.IssuedCredentialModel = (0, mongoose_1.model)('IssuedCredential', IssuedCredentialSchema);
//# sourceMappingURL=issued-credential.schema.js.map