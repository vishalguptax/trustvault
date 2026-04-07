import { Schema, model, Document, Types } from 'mongoose';

export interface VerificationRequestDocument extends Document {
  _id: Types.ObjectId;
  verifierDid: string;
  verifierName: string | null;
  purpose: string | null;
  presentationDefinition: Record<string, unknown>;
  nonce: string;
  state: string;
  callbackUrl: string | null;
  requiredCredentialTypes: string[];
  policies: string[];
  status: string;
  result: Record<string, unknown> | null;
  expiresAt: Date;
  createdAt: Date;
  completedAt: Date | null;
}

const VerificationRequestSchema = new Schema<VerificationRequestDocument>(
  {
    verifierDid: { type: String, required: true },
    verifierName: { type: String, default: null },
    purpose: { type: String, default: null },
    presentationDefinition: { type: Schema.Types.Mixed, required: true },
    nonce: { type: String, required: true, unique: true },
    state: { type: String, required: true, unique: true },
    callbackUrl: { type: String, default: null },
    requiredCredentialTypes: { type: [String], default: [] },
    policies: { type: [String], default: [] },
    status: { type: String, default: 'pending' },
    result: { type: Schema.Types.Mixed, default: null },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'verification_requests' },
);

export const VerificationRequestModel = model<VerificationRequestDocument>('VerificationRequest', VerificationRequestSchema);
export { VerificationRequestSchema };
