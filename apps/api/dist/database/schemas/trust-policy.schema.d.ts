import { Schema, Document, Types } from 'mongoose';
export interface TrustPolicyDocument extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string | null;
    rules: Record<string, unknown>;
    active: boolean;
    createdAt: Date;
}
declare const TrustPolicySchema: Schema<TrustPolicyDocument, import("mongoose").Model<TrustPolicyDocument, any, any, any, any, any, TrustPolicyDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TrustPolicyDocument, Document<unknown, {}, TrustPolicyDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<TrustPolicyDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, TrustPolicyDocument, Document<unknown, {}, TrustPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, TrustPolicyDocument, Document<unknown, {}, TrustPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, TrustPolicyDocument, Document<unknown, {}, TrustPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | null, TrustPolicyDocument, Document<unknown, {}, TrustPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    active?: import("mongoose").SchemaDefinitionProperty<boolean, TrustPolicyDocument, Document<unknown, {}, TrustPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rules?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, TrustPolicyDocument, Document<unknown, {}, TrustPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<TrustPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, TrustPolicyDocument>;
export declare const TrustPolicyModel: import("mongoose").Model<TrustPolicyDocument, {}, {}, {}, Document<unknown, {}, TrustPolicyDocument, {}, import("mongoose").DefaultSchemaOptions> & TrustPolicyDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, TrustPolicyDocument>;
export { TrustPolicySchema };
//# sourceMappingURL=trust-policy.schema.d.ts.map