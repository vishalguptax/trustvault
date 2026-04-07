import { Schema, model, Document, Types } from 'mongoose';

export interface CredentialOfferDocument extends Document {
  _id: Types.ObjectId;
  issuerDid: string;
  schemaTypeUri: string;
  preAuthorizedCode: string;
  pinRequired: boolean;
  pinHash: string | null;
  claims: Record<string, unknown>;
  accessToken: string | null;
  cNonce: string | null;
  status: string;
  expiresAt: Date;
  createdAt: Date;
}

const CredentialOfferSchema = new Schema<CredentialOfferDocument>(
  {
    issuerDid: { type: String, required: true },
    schemaTypeUri: { type: String, required: true },
    preAuthorizedCode: { type: String, required: true, unique: true },
    pinRequired: { type: Boolean, default: false },
    pinHash: { type: String, default: null },
    claims: { type: Schema.Types.Mixed, required: true },
    accessToken: { type: String, default: null },
    cNonce: { type: String, default: null },
    status: { type: String, default: 'pending' },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'credential_offers' },
);

export const CredentialOfferModel = model<CredentialOfferDocument>('CredentialOffer', CredentialOfferSchema);
export { CredentialOfferSchema };
