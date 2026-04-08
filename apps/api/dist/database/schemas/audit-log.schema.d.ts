import { Schema, Document, Types } from 'mongoose';
export interface AuditLogDocument extends Document {
    _id: Types.ObjectId;
    action: string;
    actorDid: string;
    targetId: string;
    details: Record<string, unknown> | null;
    timestamp: Date;
}
declare const AuditLogSchema: Schema<AuditLogDocument, import("mongoose").Model<AuditLogDocument, any, any, any, any, any, AuditLogDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, AuditLogDocument, Document<unknown, {}, AuditLogDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<AuditLogDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, AuditLogDocument, Document<unknown, {}, AuditLogDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLogDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    action?: import("mongoose").SchemaDefinitionProperty<string, AuditLogDocument, Document<unknown, {}, AuditLogDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLogDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    actorDid?: import("mongoose").SchemaDefinitionProperty<string, AuditLogDocument, Document<unknown, {}, AuditLogDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLogDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    targetId?: import("mongoose").SchemaDefinitionProperty<string, AuditLogDocument, Document<unknown, {}, AuditLogDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLogDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    details?: import("mongoose").SchemaDefinitionProperty<Record<string, unknown> | null, AuditLogDocument, Document<unknown, {}, AuditLogDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLogDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    timestamp?: import("mongoose").SchemaDefinitionProperty<Date, AuditLogDocument, Document<unknown, {}, AuditLogDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<AuditLogDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, AuditLogDocument>;
export declare const AuditLogModel: import("mongoose").Model<AuditLogDocument, {}, {}, {}, Document<unknown, {}, AuditLogDocument, {}, import("mongoose").DefaultSchemaOptions> & AuditLogDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, AuditLogDocument>;
export { AuditLogSchema };
//# sourceMappingURL=audit-log.schema.d.ts.map