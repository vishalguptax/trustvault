import { Schema, Document, Types } from 'mongoose';
export interface VerificationRequestDocument extends Document {
    _id: Types.ObjectId;
    verifierDid: string;
    verifierName: string | null;
    purpose: string | null;
    presentationDefinition: Record<string, unknown>;
    nonce: string;
    state: string;
    callbackUrl: string | null;
    requiredCredentialTypes: string[];
    policies: string[];
    status: string;
    result: Record<string, unknown> | null;
    expiresAt: Date;
    createdAt: Date;
    completedAt: Date | null;
}
declare const VerificationRequestSchema: Schema<VerificationRequestDocument, import("mongoose").Model<VerificationRequestDocument, any, any, any, any, any, VerificationRequestDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    result?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown> | null, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    purpose?: import("mongoose").SchemaDefinitionProperty<string | null, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    verifierDid?: import("mongoose").SchemaDefinitionProperty<string, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    verifierName?: import("mongoose").SchemaDefinitionProperty<string | null, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    presentationDefinition?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    nonce?: import("mongoose").SchemaDefinitionProperty<string, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    state?: import("mongoose").SchemaDefinitionProperty<string, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    callbackUrl?: import("mongoose").SchemaDefinitionProperty<string | null, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    requiredCredentialTypes?: import("mongoose").SchemaDefinitionProperty<string[], VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    policies?: import("mongoose").SchemaDefinitionProperty<string[], VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    completedAt?: import("mongoose").SchemaDefinitionProperty<Date | null, VerificationRequestDocument, Document<unknown, {}, VerificationRequestDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<VerificationRequestDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, VerificationRequestDocument>;
export declare const VerificationRequestModel: import("mongoose").Model<VerificationRequestDocument, {}, {}, {}, Document<unknown, {}, VerificationRequestDocument, {}, import("mongoose").DefaultSchemaOptions> & VerificationRequestDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, VerificationRequestDocument>;
export { VerificationRequestSchema };
//# sourceMappingURL=verification-request.schema.d.ts.map