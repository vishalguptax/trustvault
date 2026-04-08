import { Schema, Document, Types } from 'mongoose';
export interface ConsentRecordDocument extends Document {
    _id: Types.ObjectId;
    holderId: string;
    verifierDid: string;
    verifierName: string | null;
    credentialIds: string[];
    disclosedClaims: Record<string, unknown>;
    purpose: string | null;
    consentGivenAt: Date;
}
declare const ConsentRecordSchema: Schema<ConsentRecordDocument, import("mongoose").Model<ConsentRecordDocument, any, any, any, any, any, ConsentRecordDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    purpose?: import("mongoose").SchemaDefinitionProperty<string | null, ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    holderId?: import("mongoose").SchemaDefinitionProperty<string, ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    verifierDid?: import("mongoose").SchemaDefinitionProperty<string, ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    verifierName?: import("mongoose").SchemaDefinitionProperty<string | null, ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    credentialIds?: import("mongoose").SchemaDefinitionProperty<string[], ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    disclosedClaims?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown>, ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    consentGivenAt?: import("mongoose").SchemaDefinitionProperty<Date, ConsentRecordDocument, Document<unknown, {}, ConsentRecordDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<ConsentRecordDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, ConsentRecordDocument>;
export declare const ConsentRecordModel: import("mongoose").Model<ConsentRecordDocument, {}, {}, {}, Document<unknown, {}, ConsentRecordDocument, {}, import("mongoose").DefaultSchemaOptions> & ConsentRecordDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, ConsentRecordDocument>;
export { ConsentRecordSchema };
//# sourceMappingURL=consent-record.schema.d.ts.map