"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditLogSchema = exports.AuditLogModel = void 0;
const mongoose_1 = require("mongoose");
const AuditLogSchema = new mongoose_1.Schema({
    action: { type: String, required: true, index: true },
    actorDid: { type: String, required: true, index: true },
    targetId: { type: String, required: true },
    details: { type: mongoose_1.Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
}, { collection: 'audit_logs' });
exports.AuditLogSchema = AuditLogSchema;
exports.AuditLogModel = (0, mongoose_1.model)('AuditLog', AuditLogSchema);
//# sourceMappingURL=audit-log.schema.js.map