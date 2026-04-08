"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusListSchema = exports.StatusListModel = void 0;
const mongoose_1 = require("mongoose");
const StatusListSchema = new mongoose_1.Schema({
    issuerDid: { type: String, required: true, index: true },
    purpose: { type: String, default: 'revocation' },
    encodedList: { type: String, required: true },
    currentIndex: { type: Number, default: 0 },
    size: { type: Number, default: 131072 },
    publishedUrl: { type: String, default: null },
}, { timestamps: true, collection: 'status_lists' });
exports.StatusListSchema = StatusListSchema;
exports.StatusListModel = (0, mongoose_1.model)('StatusList', StatusListSchema);
//# sourceMappingURL=status-list.schema.js.map