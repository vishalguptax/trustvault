import { Schema, model, Document, Types } from 'mongoose';

export interface StatusListDocument extends Document {
  _id: Types.ObjectId;
  issuerDid: string;
  purpose: string;
  encodedList: string;
  currentIndex: number;
  size: number;
  publishedUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const StatusListSchema = new Schema<StatusListDocument>(
  {
    issuerDid: { type: String, required: true, index: true },
    purpose: { type: String, default: 'revocation' },
    encodedList: { type: String, required: true },
    currentIndex: { type: Number, default: 0 },
    size: { type: Number, default: 131072 },
    publishedUrl: { type: String, default: null },
  },
  { timestamps: true, collection: 'status_lists' },
);

export const StatusListModel = model<StatusListDocument>('StatusList', StatusListSchema);
export { StatusListSchema };
