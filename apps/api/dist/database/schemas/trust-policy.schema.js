"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustPolicySchema = exports.TrustPolicyModel = void 0;
const mongoose_1 = require("mongoose");
const TrustPolicySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    rules: { type: mongoose_1.Schema.Types.Mixed, required: true },
    active: { type: Boolean, default: true },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'trust_policies' });
exports.TrustPolicySchema = TrustPolicySchema;
exports.TrustPolicyModel = (0, mongoose_1.model)('TrustPolicy', TrustPolicySchema);
//# sourceMappingURL=trust-policy.schema.js.map