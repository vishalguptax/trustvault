import { Schema, Document, Types } from 'mongoose';
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
declare const DidSchema: Schema<DidDocument, import("mongoose").Model<DidDocument, any, any, any, any, any, DidDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, DidDocument, Document<unknown, {}, DidDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, DidDocument, Document<unknown, {}, DidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, DidDocument, Document<unknown, {}, DidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    keys?: import("mongoose").SchemaDefinitionProperty<DidKeyEntry[], DidDocument, Document<unknown, {}, DidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    active?: import("mongoose").SchemaDefinitionProperty<boolean, DidDocument, Document<unknown, {}, DidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, DidDocument, Document<unknown, {}, DidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    did?: import("mongoose").SchemaDefinitionProperty<string, DidDocument, Document<unknown, {}, DidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    method?: import("mongoose").SchemaDefinitionProperty<string, DidDocument, Document<unknown, {}, DidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    document?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, DidDocument, Document<unknown, {}, DidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<DidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, DidDocument>;
export declare const DidModel: import("mongoose").Model<DidDocument, {}, {}, {}, Document<unknown, {}, DidDocument, {}, import("mongoose").DefaultSchemaOptions> & DidDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, DidDocument>;
export { DidSchema };
//# sourceMappingURL=did.schema.d.ts.map