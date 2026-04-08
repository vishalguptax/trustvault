"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierPolicySchema = exports.VerifierPolicyModel = void 0;
const mongoose_1 = require("mongoose");
const VerifierPolicySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    rules: { type: mongoose_1.Schema.Types.Mixed, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'verifier_policies' });
exports.VerifierPolicySchema = VerifierPolicySchema;
exports.VerifierPolicyModel = (0, mongoose_1.model)('VerifierPolicy', VerifierPolicySchema);
//# sourceMappingURL=verifier-policy.schema.js.map