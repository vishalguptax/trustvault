import { Schema, Document, Types } from 'mongoose';
export interface TrustedIssuerDocument extends Document {
    _id: Types.ObjectId;
    did: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    website: string | null;
    credentialTypes: string[];
    status: string;
    registeredBy: string | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const TrustedIssuerSchema: Schema<TrustedIssuerDocument, import("mongoose").Model<TrustedIssuerDocument, any, any, any, any, any, TrustedIssuerDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | null, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    did?: import("mongoose").SchemaDefinitionProperty<string, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    logoUrl?: import("mongoose").SchemaDefinitionProperty<string | null, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    website?: import("mongoose").SchemaDefinitionProperty<string | null, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    credentialTypes?: import("mongoose").SchemaDefinitionProperty<string[], TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    registeredBy?: import("mongoose").SchemaDefinitionProperty<string | null, TrustedIssuerDocument, Document<unknown, {}, TrustedIssuerDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustedIssuerDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, TrustedIssuerDocument>;
export declare const TrustedIssuerModel: import("mongoose").Model<TrustedIssuerDocument, {}, {}, {}, Document<unknown, {}, TrustedIssuerDocument, {}, import("mongoose").DefaultSchemaOptions> & TrustedIssuerDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, TrustedIssuerDocument>;
export { TrustedIssuerSchema };
//# sourceMappingURL=trusted-issuer.schema.d.ts.map