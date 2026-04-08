import { Schema, Document, Types } from 'mongoose';
export interface VerifierPolicyDocument extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string | null;
    rules: Record<string, unknown>;
    active: boolean;
    createdAt: Date;
}
declare const VerifierPolicySchema: Schema<VerifierPolicyDocument, import("mongoose").Model<VerifierPolicyDocument, any, any, any, any, any, VerifierPolicyDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VerifierPolicyDocument, Document<unknown, {}, VerifierPolicyDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<VerifierPolicyDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, VerifierPolicyDocument, Document<unknown, {}, VerifierPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerifierPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, VerifierPolicyDocument, Document<unknown, {}, VerifierPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerifierPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, VerifierPolicyDocument, Document<unknown, {}, VerifierPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerifierPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    description?: import("mongoose").SchemaDefinitionProperty<string | null, VerifierPolicyDocument, Document<unknown, {}, VerifierPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerifierPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    active?: import("mongoose").SchemaDefinitionProperty<boolean, VerifierPolicyDocument, Document<unknown, {}, VerifierPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerifierPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    rules?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, VerifierPolicyDocument, Document<unknown, {}, VerifierPolicyDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerifierPolicyDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, VerifierPolicyDocument>;
export declare const VerifierPolicyModel: import("mongoose").Model<VerifierPolicyDocument, {}, {}, {}, Document<unknown, {}, VerifierPolicyDocument, {}, import("mongoose").DefaultSchemaOptions> & VerifierPolicyDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, VerifierPolicyDocument>;
export { VerifierPolicySchema };
//# sourceMappingURL=verifier-policy.schema.d.ts.map