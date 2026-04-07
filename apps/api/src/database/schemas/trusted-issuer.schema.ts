import { Schema, model, Document, Types } from 'mongoose';

export interface TrustedIssuerDocument extends Document {
  _id: Types.ObjectId;
  did: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  credentialTypes: string[];
  status: string;
  registeredBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TrustedIssuerSchema = new Schema<TrustedIssuerDocument>(
  {
    did: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    logoUrl: { type: String, default: null },
    website: { type: String, default: null },
    credentialTypes: { type: [String], default: [] },
    status: { type: String, default: 'active' },
    registeredBy: { type: String, default: null },
  },
  { timestamps: true, collection: 'trusted_issuers' },
);

export const TrustedIssuerModel = model<TrustedIssuerDocument>('TrustedIssuer', TrustedIssuerSchema);
export { TrustedIssuerSchema };
