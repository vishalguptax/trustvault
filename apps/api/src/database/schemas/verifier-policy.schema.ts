import { Schema, model, Document, Types } from 'mongoose';

export interface VerifierPolicyDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string | null;
  rules: Record<string, unknown>;
  active: boolean;
  createdAt: Date;
}

const VerifierPolicySchema = new Schema<VerifierPolicyDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    rules: { type: Schema.Types.Mixed, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'verifier_policies' },
);

export const VerifierPolicyModel = model<VerifierPolicyDocument>('VerifierPolicy', VerifierPolicySchema);
export { VerifierPolicySchema };
