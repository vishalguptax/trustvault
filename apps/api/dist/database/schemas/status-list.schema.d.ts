import { Schema, Document, Types } from 'mongoose';
export interface StatusListDocument extends Document {
    _id: Types.ObjectId;
    issuerDid: string;
    purpose: string;
    encodedList: string;
    currentIndex: number;
    size: number;
    publishedUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}
declare const StatusListSchema: Schema<StatusListDocument, import("mongoose").Model<StatusListDocument, any, any, any, any, any, StatusListDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, StatusListDocument, Document<unknown, {}, StatusListDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    size?: import("mongoose").SchemaDefinitionProperty<number, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    issuerDid?: import("mongoose").SchemaDefinitionProperty<string, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    purpose?: import("mongoose").SchemaDefinitionProperty<string, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    encodedList?: import("mongoose").SchemaDefinitionProperty<string, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    currentIndex?: import("mongoose").SchemaDefinitionProperty<number, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    publishedUrl?: import("mongoose").SchemaDefinitionProperty<string | null, StatusListDocument, Document<unknown, {}, StatusListDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<StatusListDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, StatusListDocument>;
export declare const StatusListModel: import("mongoose").Model<StatusListDocument, {}, {}, {}, Document<unknown, {}, StatusListDocument, {}, import("mongoose").DefaultSchemaOptions> & StatusListDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, StatusListDocument>;
export { StatusListSchema };
//# sourceMappingURL=status-list.schema.d.ts.map