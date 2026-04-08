import { WalletService } from './wallet.service';
declare class ReceiveCredentialDto {
    credentialOfferUri: string;
    holderId: string;
}
declare class CreatePresentationDto {
    verificationRequestId: string;
    holderId: string;
    selectedCredentials: string[];
    disclosedClaims: Record<string, string[]>;
    consent: boolean;
}
declare class CreateWalletDidDto {
    holderId: string;
    method?: string;
}
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    receiveCredential(dto: ReceiveCredentialDto): Promise<{
        data: {
            credentialId: string;
            type: string;
            typeName: string;
            issuerDid: string;
            issuerName: string | null;
            subjectDid: string | null;
            claims: {
                [x: string]: unknown;
            };
            sdClaims: string[];
            rawCredential: string;
            status: string;
            issuedAt: Date;
            expiresAt: Date | null;
        };
    }>;
    listCredentials(holderId: string): Promise<{
        data: {
            credentials: {
                id: string;
                subjectDid: string;
                typeName: string;
                issuerName: string | null;
                holderId: string;
                rawCredential: string;
                format: string;
                credentialType: string;
                issuerDid: string;
                claims: Record<string, unknown>;
                sdClaims: string[];
                issuedAt: Date;
                expiresAt: Date | null;
                metadata: Record<string, unknown> | null;
                createdAt: Date;
                $locals: Record<string, unknown>;
                $op: "save" | "validate" | "remove" | null;
                $where: Record<string, unknown>;
                baseModelName?: string;
                collection: import("mongoose").Collection;
                db: import("mongoose").Connection;
                errors?: import("mongoose").Error.ValidationError;
                isNew: boolean;
                schema: import("mongoose").Schema;
                __v: number;
            }[];
            total: number;
        };
    }>;
    getCredential(id: string): Promise<{
        data: {
            id: string;
            holderId: string;
            rawCredential: string;
            format: string;
            credentialType: string;
            issuerDid: string;
            claims: Record<string, unknown>;
            sdClaims: string[];
            issuedAt: Date;
            expiresAt: Date | null;
            metadata: Record<string, unknown> | null;
            createdAt: Date;
            $locals: Record<string, unknown>;
            $op: "save" | "validate" | "remove" | null;
            $where: Record<string, unknown>;
            baseModelName?: string;
            collection: import("mongoose").Collection;
            db: import("mongoose").Connection;
            errors?: import("mongoose").Error.ValidationError;
            isNew: boolean;
            schema: import("mongoose").Schema;
            __v: number;
        };
    }>;
    getCredentialClaims(id: string): Promise<{
        data: {
            fixedClaims: {
                key: string;
                value: unknown;
                selectable: boolean;
            }[];
            selectiveClaims: {
                key: string;
                value: unknown;
                selectable: boolean;
            }[];
        };
    }>;
    deleteCredential(id: string): Promise<{
        data: {
            deleted: boolean;
        };
    }>;
    createPresentation(dto: CreatePresentationDto): Promise<{
        data: {
            presentationId: string;
            vpToken: string;
            verificationId: string;
            result: string;
            checks: Record<string, unknown>;
        };
    }>;
    getConsentHistory(holderId: string): Promise<{
        data: (Omit<import("../../database/schemas").ConsentRecordDocument & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }, "_id"> & {
            id: string;
        })[];
    }>;
    createDid(dto: CreateWalletDidDto): Promise<{
        data: {
            did: string;
            method: string;
            createdAt: Date;
        };
    }>;
}
export {};
//# sourceMappingURL=wallet.controller.d.ts.map