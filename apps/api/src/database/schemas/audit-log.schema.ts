import { Schema, model, Document, Types } from 'mongoose';

export interface AuditLogDocument extends Document {
  _id: Types.ObjectId;
  action: string;
  actorDid: string;
  targetId: string;
  details: Record<string, unknown> | null;
  timestamp: Date;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    action: { type: String, required: true, index: true },
    actorDid: { type: String, required: true, index: true },
    targetId: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { collection: 'audit_logs' },
);

export const AuditLogModel = model<AuditLogDocument>('AuditLog', AuditLogSchema);
export { AuditLogSchema };
