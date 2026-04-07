import { Schema, model, Document, Types } from 'mongoose';

export interface TrustPolicyDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  description: string | null;
  rules: Record<string, unknown>;
  active: boolean;
  createdAt: Date;
}

const TrustPolicySchema = new Schema<TrustPolicyDocument>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, default: null },
    rules: { type: Schema.Types.Mixed, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'trust_policies' },
);

export const TrustPolicyModel = model<TrustPolicyDocument>('TrustPolicy', TrustPolicySchema);
export { TrustPolicySchema };
