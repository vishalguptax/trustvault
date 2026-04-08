import { Schema, Document, Types } from 'mongoose';
export interface WalletCredentialDocument extends Document {
    _id: Types.ObjectId;
    holderId: string;
    rawCredential: string;
    format: string;
    credentialType: string;
    issuerDid: string;
    claims: Record<string, unknown>;
    sdClaims: string[];
    issuedAt: Date;
    expiresAt: Date | null;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
}
declare const WalletCredentialSchema: Schema<WalletCredentialDocument, import("mongoose").Model<WalletCredentialDocument, any, any, any, any, any, WalletCredentialDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    sdClaims?: import("mongoose").SchemaDefinitionProperty<string[], WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    issuerDid?: import("mongoose").SchemaDefinitionProperty<string, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    claims?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date | null, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    issuedAt?: import("mongoose").SchemaDefinitionProperty<Date, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown> | null, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    holderId?: import("mongoose").SchemaDefinitionProperty<string, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rawCredential?: import("mongoose").SchemaDefinitionProperty<string, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    format?: import("mongoose").SchemaDefinitionProperty<string, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    credentialType?: import("mongoose").SchemaDefinitionProperty<string, WalletCredentialDocument, Document<unknown, {}, WalletCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, WalletCredentialDocument>;
export declare const WalletCredentialModel: import("mongoose").Model<WalletCredentialDocument, {}, {}, {}, Document<unknown, {}, WalletCredentialDocument, {}, import("mongoose").DefaultSchemaOptions> & WalletCredentialDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, WalletCredentialDocument>;
export { WalletCredentialSchema };
//# sourceMappingURL=wallet-credential.schema.d.ts.map