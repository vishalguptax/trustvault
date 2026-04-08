"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const ApiKeySchema = new mongoose_1.Schema({
    hash: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
}, { _id: false });
const UserSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: 'holder', index: true },
    trustedIssuerId: { type: String, default: null },
    refreshTokens: { type: [String], default: [] },
    apiKeys: { type: [ApiKeySchema], default: [] },
    resetOtpHash: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
    active: { type: Boolean, default: true },
}, { timestamps: true, collection: 'users' });
exports.UserSchema = UserSchema;
exports.UserModel = (0, mongoose_1.model)('User', UserSchema);
//# sourceMappingURL=user.schema.js.map