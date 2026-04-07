import { Schema, model, Document, Types } from 'mongoose';

export interface ConsentRecordDocument extends Document {
  _id: Types.ObjectId;
  holderId: string;
  verifierDid: string;
  verifierName: string | null;
  credentialIds: string[];
  disclosedClaims: Record<string, unknown>;
  purpose: string | null;
  consentGivenAt: Date;
}

const ConsentRecordSchema = new Schema<ConsentRecordDocument>(
  {
    holderId: { type: String, required: true, index: true },
    verifierDid: { type: String, required: true },
    verifierName: { type: String, default: null },
    credentialIds: { type: [String], default: [] },
    disclosedClaims: { type: Schema.Types.Mixed, required: true },
    purpose: { type: String, default: null },
    consentGivenAt: { type: Date, default: Date.now },
  },
  { collection: 'consent_records' },
);

export const ConsentRecordModel = model<ConsentRecordDocument>('ConsentRecord', ConsentRecordSchema);
export { ConsentRecordSchema };
