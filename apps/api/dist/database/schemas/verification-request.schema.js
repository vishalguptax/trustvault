"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationRequestSchema = exports.VerificationRequestModel = void 0;
const mongoose_1 = require("mongoose");
const VerificationRequestSchema = new mongoose_1.Schema({
    verifierDid: { type: String, required: true },
    verifierName: { type: String, default: null },
    purpose: { type: String, default: null },
    presentationDefinition: { type: mongoose_1.Schema.Types.Mixed, required: true },
    nonce: { type: String, required: true, unique: true },
    state: { type: String, required: true, unique: true },
    callbackUrl: { type: String, default: null },
    requiredCredentialTypes: { type: [String], default: [] },
    policies: { type: [String], default: [] },
    status: { type: String, default: 'pending' },
    result: { type: mongoose_1.Schema.Types.Mixed, default: null },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'verification_requests' });
exports.VerificationRequestSchema = VerificationRequestSchema;
exports.VerificationRequestModel = (0, mongoose_1.model)('VerificationRequest', VerificationRequestSchema);
//# sourceMappingURL=verification-request.schema.js.map