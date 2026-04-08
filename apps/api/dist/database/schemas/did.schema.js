"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidSchema = exports.DidModel = void 0;
const mongoose_1 = require("mongoose");
const DidKeySchema = new mongoose_1.Schema({
    kid: { type: String, required: true },
    type: { type: String, required: true },
    publicKeyJwk: { type: mongoose_1.Schema.Types.Mixed, required: true },
    privateKeyJwk: { type: mongoose_1.Schema.Types.Mixed, default: null },
    purposes: { type: [String], default: [] },
}, { _id: false });
const DidSchema = new mongoose_1.Schema({
    did: { type: String, required: true, unique: true },
    method: { type: String, required: true },
    document: { type: mongoose_1.Schema.Types.Mixed, required: true },
    keys: { type: [DidKeySchema], default: [] },
    active: { type: Boolean, default: true },
}, { timestamps: true, collection: 'dids' });
exports.DidSchema = DidSchema;
exports.DidModel = (0, mongoose_1.model)('Did', DidSchema);
//# sourceMappingURL=did.schema.js.map