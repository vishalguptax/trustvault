import { Schema, Document, Types } from 'mongoose';
export interface CredentialOfferDocument extends Document {
    _id: Types.ObjectId;
    issuerDid: string;
    schemaTypeUri: string;
    preAuthorizedCode: string;
    pinRequired: boolean;
    pinHash: string | null;
    claims: Record<string, unknown>;
    accessToken: string | null;
    cNonce: string | null;
    status: string;
    expiresAt: Date;
    createdAt: Date;
}
declare const CredentialOfferSchema: Schema<CredentialOfferDocument, import("mongoose").Model<CredentialOfferDocument, any, any, any, any, any, CredentialOfferDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    issuerDid?: import("mongoose").SchemaDefinitionProperty<string, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    schemaTypeUri?: import("mongoose").SchemaDefinitionProperty<string, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    preAuthorizedCode?: import("mongoose").SchemaDefinitionProperty<string, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pinRequired?: import("mongoose").SchemaDefinitionProperty<boolean, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    pinHash?: import("mongoose").SchemaDefinitionProperty<string | null, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    claims?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    accessToken?: import("mongoose").SchemaDefinitionProperty<string | null, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    cNonce?: import("mongoose").SchemaDefinitionProperty<string | null, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, CredentialOfferDocument, Document<unknown, {}, CredentialOfferDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<CredentialOfferDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, CredentialOfferDocument>;
export declare const CredentialOfferModel: import("mongoose").Model<CredentialOfferDocument, {}, {}, {}, Document<unknown, {}, CredentialOfferDocument, {}, import("mongoose").DefaultSchemaOptions> & CredentialOfferDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, CredentialOfferDocument>;
export { CredentialOfferSchema };
//# sourceMappingURL=credential-offer.schema.d.ts.map