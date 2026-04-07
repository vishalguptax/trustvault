import { Schema, model, Document, Types } from 'mongoose';

export interface DidKeyEntry {
  kid: string;
  type: string;
  publicKeyJwk: Record<string, unknown>;
  privateKeyJwk: Record<string, unknown> | null;
  purposes: string[];
}

export interface DidDocument extends Document {
  _id: Types.ObjectId;
  did: string;
  method: string;
  document: Record<string, unknown>;
  keys: DidKeyEntry[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DidKeySchema = new Schema<DidKeyEntry>(
  {
    kid: { type: String, required: true },
    type: { type: String, required: true },
    publicKeyJwk: { type: Schema.Types.Mixed, required: true },
    privateKeyJwk: { type: Schema.Types.Mixed, default: null },
    purposes: { type: [String], default: [] },
  },
  { _id: false },
);

const DidSchema = new Schema<DidDocument>(
  {
    did: { type: String, required: true, unique: true },
    method: { type: String, required: true },
    document: { type: Schema.Types.Mixed, required: true },
    keys: { type: [DidKeySchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'dids' },
);

export const DidModel = model<DidDocument>('Did', DidSchema);
export { DidSchema };
