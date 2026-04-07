import { Schema, model, Document, Types } from 'mongoose';

export interface ApiKeyEntry {
  hash: string;
  name: string;
  createdAt: Date;
}

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: string;
  trustedIssuerId: string | null;
  refreshTokens: string[];
  apiKeys: ApiKeyEntry[];
  resetOtpHash: string | null;
  resetOtpExpiry: Date | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<ApiKeyEntry>(
  {
    hash: { type: String, required: true },
    name: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false },
);

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true, default: 'holder', index: true },
    trustedIssuerId: { type: String, default: null },
    refreshTokens: { type: [String], default: [] },
    apiKeys: { type: [ApiKeySchema], default: [] },
    resetOtpHash: { type: String, default: null },
    resetOtpExpiry: { type: Date, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'users' },
);

export const UserModel = model<UserDocument>('User', UserSchema);
export { UserSchema };
