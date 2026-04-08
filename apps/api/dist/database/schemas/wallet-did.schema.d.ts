import { Schema, Document, Types } from 'mongoose';
export interface WalletDidDocument extends Document {
    _id: Types.ObjectId;
    holderId: string;
    did: string;
    method: string;
    keyData: Record<string, unknown>;
    isPrimary: boolean;
    createdAt: Date;
}
declare const WalletDidSchema: Schema<WalletDidDocument, import("mongoose").Model<WalletDidDocument, any, any, any, any, any, WalletDidDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, WalletDidDocument, Document<unknown, {}, WalletDidDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<WalletDidDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, WalletDidDocument, Document<unknown, {}, WalletDidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletDidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, WalletDidDocument, Document<unknown, {}, WalletDidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletDidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    did?: import("mongoose").SchemaDefinitionProperty<string, WalletDidDocument, Document<unknown, {}, WalletDidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletDidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    method?: import("mongoose").SchemaDefinitionProperty<string, WalletDidDocument, Document<unknown, {}, WalletDidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletDidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    holderId?: import("mongoose").SchemaDefinitionProperty<string, WalletDidDocument, Document<unknown, {}, WalletDidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletDidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    keyData?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, WalletDidDocument, Document<unknown, {}, WalletDidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletDidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    isPrimary?: import("mongoose").SchemaDefinitionProperty<boolean, WalletDidDocument, Document<unknown, {}, WalletDidDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<WalletDidDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, WalletDidDocument>;
export declare const WalletDidModel: import("mongoose").Model<WalletDidDocument, {}, {}, {}, Document<unknown, {}, WalletDidDocument, {}, import("mongoose").DefaultSchemaOptions> & WalletDidDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, WalletDidDocument>;
export { WalletDidSchema };
//# sourceMappingURL=wallet-did.schema.d.ts.map