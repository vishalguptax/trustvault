import { Schema, model, Types } from 'mongoose';

export interface CredentialSchemaDocument {
  _id: Types.ObjectId;
  typeUri: string;
  name: string;
  description: string | null;
  schema: Record<string, unknown>;
  sdClaims: string[];
  display: Record<string, unknown> | null;
  active: boolean;
  createdAt: Date;
}

const CredentialSchemaSchema = new Schema(
  {
    typeUri: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: null },
    schema: { type: Schema.Types.Mixed, required: true },
    sdClaims: { type: [String], default: [] },
    display: { type: Schema.Types.Mixed, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'credential_schemas' },
);

export const CredentialSchemaModel = model<CredentialSchemaDocument>('CredentialSchema', CredentialSchemaSchema);
export { CredentialSchemaSchema };
