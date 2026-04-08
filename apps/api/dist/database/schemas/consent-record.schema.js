"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsentRecordSchema = exports.ConsentRecordModel = void 0;
const mongoose_1 = require("mongoose");
const ConsentRecordSchema = new mongoose_1.Schema({
    holderId: { type: String, required: true, index: true },
    verifierDid: { type: String, required: true },
    verifierName: { type: String, default: null },
    credentialIds: { type: [String], default: [] },
    disclosedClaims: { type: mongoose_1.Schema.Types.Mixed, required: true },
    purpose: { type: String, default: null },
    consentGivenAt: { type: Date, default: Date.now },
}, { collection: 'consent_records' });
exports.ConsentRecordSchema = ConsentRecordSchema;
exports.ConsentRecordModel = (0, mongoose_1.model)('ConsentRecord', ConsentRecordSchema);
//# sourceMappingURL=consent-record.schema.js.map