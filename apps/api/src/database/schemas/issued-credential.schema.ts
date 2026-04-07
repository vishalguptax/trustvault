import { Schema, model, Document, Types } from 'mongoose';

export interface IssuedCredentialDocument extends Document {
  _id: Types.ObjectId;
  issuerDid: string;
  subjectDid: string;
  schemaTypeUri: string;
  credentialHash: string;
  statusListId: string | null;
  statusListIndex: number | null;
  status: string;
  expiresAt: Date | null;
  issuedAt: Date;
  metadata: Record<string, unknown> | null;
}

const IssuedCredentialSchema = new Schema<IssuedCredentialDocument>(
  {
    issuerDid: { type: String, required: true, index: true },
    subjectDid: { type: String, required: true, index: true },
    schemaTypeUri: { type: String, required: true },
    credentialHash: { type: String, required: true, unique: true },
    statusListId: { type: String, default: null },
    statusListIndex: { type: Number, default: null },
    status: { type: String, default: 'active', index: true },
    expiresAt: { type: Date, default: null },
    issuedAt: { type: Date, default: Date.now },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { collection: 'issued_credentials' },
);

export const IssuedCredentialModel = model<IssuedCredentialDocument>('IssuedCredential', IssuedCredentialSchema);
export { IssuedCredentialSchema };
