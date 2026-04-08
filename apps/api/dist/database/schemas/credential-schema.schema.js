"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredentialSchemaSchema = exports.CredentialSchemaModel = void 0;
const mongoose_1 = require("mongoose");
const CredentialSchemaSchema = new mongoose_1.Schema({
    typeUri: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    schema: { type: mongoose_1.Schema.Types.Mixed, required: true },
    sdClaims: { type: [String], default: [] },
    display: { type: mongoose_1.Schema.Types.Mixed, default: null },
    active: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'credential_schemas' });
exports.CredentialSchemaSchema = CredentialSchemaSchema;
exports.CredentialSchemaModel = (0, mongoose_1.model)('CredentialSchema', CredentialSchemaSchema);
//# sourceMappingURL=credential-schema.schema.js.map