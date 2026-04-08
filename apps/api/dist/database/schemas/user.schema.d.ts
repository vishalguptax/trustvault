import { Schema, Document, Types } from 'mongoose';
export interface ApiKeyEntry {
    hash: string;
    name: string;
    createdAt: Date;
}
export interface UserDocument extends Document {
    _id: Types.ObjectId;
    email: string;
    passwordHash: string;
    name: string;
    role: string;
    trustedIssuerId: string | null;
    refreshTokens: string[];
    apiKeys: ApiKeyEntry[];
    resetOtpHash: string | null;
    resetOtpExpiry: Date | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const UserSchema: Schema<UserDocument, import("mongoose").Model<UserDocument, any, any, any, any, any, UserDocument>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, UserDocument, Document<unknown, {}, UserDocument, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    _id?: import("mongoose").SchemaDefinitionProperty<Types.ObjectId, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    name?: import("mongoose").SchemaDefinitionProperty<string, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    createdAt?: import("mongoose").SchemaDefinitionProperty<Date, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    passwordHash?: import("mongoose").SchemaDefinitionProperty<string, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    role?: import("mongoose").SchemaDefinitionProperty<string, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    trustedIssuerId?: import("mongoose").SchemaDefinitionProperty<string | null, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    refreshTokens?: import("mongoose").SchemaDefinitionProperty<string[], UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    apiKeys?: import("mongoose").SchemaDefinitionProperty<ApiKeyEntry[], UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    resetOtpHash?: import("mongoose").SchemaDefinitionProperty<string | null, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    resetOtpExpiry?: import("mongoose").SchemaDefinitionProperty<Date | null, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    active?: import("mongoose").SchemaDefinitionProperty<boolean, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    updatedAt?: import("mongoose").SchemaDefinitionProperty<Date, UserDocument, Document<unknown, {}, UserDocument, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<UserDocument & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, UserDocument>;
export declare const UserModel: import("mongoose").Model<UserDocument, {}, {}, {}, Document<unknown, {}, UserDocument, {}, import("mongoose").DefaultSchemaOptions> & UserDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, UserDocument>;
export { UserSchema };
//# sourceMappingURL=user.schema.d.ts.map