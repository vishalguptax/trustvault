"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletDidSchema = exports.WalletDidModel = void 0;
const mongoose_1 = require("mongoose");
const WalletDidSchema = new mongoose_1.Schema({
    holderId: { type: String, required: true, index: true },
    did: { type: String, required: true, unique: true },
    method: { type: String, required: true },
    keyData: { type: mongoose_1.Schema.Types.Mixed, required: true },
    isPrimary: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false }, collection: 'wallet_dids' });
exports.WalletDidSchema = WalletDidSchema;
exports.WalletDidModel = (0, mongoose_1.model)('WalletDid', WalletDidSchema);
//# sourceMappingURL=wallet-did.schema.js.map