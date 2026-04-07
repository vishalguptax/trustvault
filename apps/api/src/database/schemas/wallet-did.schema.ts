import { Schema, model, Document, Types } from 'mongoose';

export interface WalletDidDocument extends Document {
  _id: Types.ObjectId;
  holderId: string;
  did: string;
  method: string;
  keyData: Record<string, unknown>;
  isPrimary: boolean;
  createdAt: Date;
}

const WalletDidSchema = new Schema<WalletDidDocument>(
  {
    holderId: { type: String, required: true, index: true },
    did: { type: String, required: true, unique: true },
    method: { type: String, required: true },
    keyData: { type: Schema.Types.Mixed, required: true },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'wallet_dids' },
);

export const WalletDidModel = model<WalletDidDocument>('WalletDid', WalletDidSchema);
export { WalletDidSchema };
