import { Schema, model, Document, Types } from 'mongoose';

export interface WalletCredentialDocument extends Document {
  _id: Types.ObjectId;
  holderId: string;
  rawCredential: string;
  format: string;
  credentialType: string;
  issuerDid: string;
  claims: Record<string, unknown>;
  sdClaims: string[];
  issuedAt: Date;
  expiresAt: Date | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

const WalletCredentialSchema = new Schema<WalletCredentialDocument>(
  {
    holderId: { type: String, required: true, index: true },
    rawCredential: { type: String, required: true },
    format: { type: String, required: true },
    credentialType: { type: String, required: true, index: true },
    issuerDid: { type: String, required: true },
    claims: { type: Schema.Types.Mixed, required: true },
    sdClaims: { type: [String], default: [] },
    issuedAt: { type: Date, required: true },
    expiresAt: { type: Date, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'wallet_credentials' },
);

export const WalletCredentialModel = model<WalletCredentialDocument>('WalletCredential', WalletCredentialSchema);
export { WalletCredentialSchema };
