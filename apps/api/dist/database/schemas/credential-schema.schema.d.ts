import { Schema, Types } from 'mongoose';
export interface CredentialSchemaDocument {
    _id: Types.ObjectId;
    typeUri: string;
    name: string;
    description: string | null;
    schema: Record<string, unknown>;
    sdClaims: string[];
    display: Record<string, unknown> | null;
    active: boolean;
    createdAt: Date;
}
declare const CredentialSchemaSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: {
        createdAt: true;
        updatedAt: false;
    };
    collection: string;
}, {
    name: string;
    schema: any;
    active: boolean;
    typeUri: string;
    sdClaims: string[];
    description?: string | null | undefined;
    display?: any;
    createdAt: NativeDate;
}, import("mongoose").Document<unknown, {}, {
    name: string;
    schema: any;
    active: boolean;
    typeUri: string;
    sdClaims: string[];
    description?: string | null | undefined;
    display?: any;
    createdAt: NativeDate;
}, {
    id: string;
}, Omit<import("mongoose").DefaultSchemaOptions, "timestamps" | "collection"> & {
    timestamps: {
        createdAt: true;
        updatedAt: false;
    };
    collection: string;
}> & Omit<{
    name: string;
    schema: any;
    active: boolean;
    typeUri: string;
    sdClaims: string[];
    description?: string | null | undefined;
    display?: any;
    createdAt: NativeDate;
} & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    name: string;
    schema: any;
    active: boolean;
    typeUri: string;
    sdClaims: string[];
    description?: string | null | undefined;
    display?: any;
    createdAt: NativeDate;
} & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
export declare const CredentialSchemaModel: import("mongoose").Model<CredentialSchemaDocument, {}, {}, {}, import("mongoose").Document<unknown, {}, CredentialSchemaDocument, {}, import("mongoose").DefaultSchemaOptions> & CredentialSchemaDocument & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
} & {
    id: string;
}, any, CredentialSchemaDocument>;
export { CredentialSchemaSchema };
//# sourceMappingURL=credential-schema.schema.d.ts.map