import { Schema, Document, Types } from 'mongoose';
export interface IssuedCredentialDocument extends Document {
    _id: Types.ObjectId;
    issuerDid: string;
    subjectDid: string;
    schemaTypeUri: string;
    credentialHash: string;
    statusListId: string | null;
    statusListIndex: number | null;
    status: string;
    expiresAt: Date | null;
    issuedAt: Date;
    metadata: Record<string, unknown> | null;
}
declare const IssuedCredentialSchema: Schema<IssuedCredentialDocument, import("mongoose").Model<IssuedCredentialDocument, any, any, any, any, any, IssuedCredentialDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    issuerDid?: import("mongoose").SchemaDefinitionProperty<string, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    schemaTypeUri?: import("mongoose").SchemaDefinitionProperty<string, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    expiresAt?: import("mongoose").SchemaDefinitionProperty<Date | null, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    subjectDid?: import("mongoose").SchemaDefinitionProperty<string, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    credentialHash?: import("mongoose").SchemaDefinitionProperty<string, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    statusListId?: import("mongoose").SchemaDefinitionProperty<string | null, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    statusListIndex?: import("mongoose").SchemaDefinitionProperty<number | null, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    issuedAt?: import("mongoose").SchemaDefinitionProperty<Date, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    metadata?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown> | null, IssuedCredentialDocument, Document<unknown, {}, IssuedCredentialDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<IssuedCredentialDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, IssuedCredentialDocument>;
export declare const IssuedCredentialModel: import("mongoose").Model<IssuedCredentialDocument, {}, {}, {}, Document<unknown, {}, IssuedCredentialDocument, {}, import("mongoose").DefaultSchemaOptions> & IssuedCredentialDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, IssuedCredentialDocument>;
export { IssuedCredentialSchema };
//# sourceMappingURL=issued-credential.schema.d.ts.map