import type { JWK } from 'jose';
import { DatabaseService } from '../../database/database.service';
import { DidService } from '../did/did.service';
import { SdJwtService } from '../crypto/sd-jwt.service';
import { Oid4vciClientService } from './oid4vci-client.service';
import { ConsentService } from './consent.service';
import { VerifierService } from '../verifier/verifier.service';
import { MailService } from '../mail/mail.service';
export declare class WalletService {
    private readonly db;
    private readonly didService;
    private readonly sdJwtService;
    private readonly oid4vciClient;
    private readonly consentService;
    private readonly verifierService;
    private readonly mailService;
    constructor(db: DatabaseService, didService: DidService, sdJwtService: SdJwtService, oid4vciClient: Oid4vciClientService, consentService: ConsentService, verifierService: VerifierService, mailService: MailService);
    createHolderDid(holderId: string, method?: string): Promise<{
        did: string;
        method: string;
        createdAt: Date;
    }>;
    getOrCreateHolderDid(holderId: string): Promise<{
        did: string;
        keyPair: {
            publicKey: JWK;
            privateKey: JWK;
        };
    }>;
    receiveCredential(credentialOfferUri: string, holderId: string): Promise<{
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
    }>;
    listCredentials(holderId: string): Promise<{
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
    }>;
    getCredential(id: string): Promise<{
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
    }>;
    getCredentialClaims(id: string): Promise<{
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
    }>;
    deleteCredential(id: string): Promise<{
        deleted: boolean;
    }>;
    createPresentation(verificationRequestId: string, holderId: string, selectedCredentials: string[], disclosedClaims: Record<string, string[]>, consent: boolean): Promise<{
        presentationId: string;
        vpToken: string;
        verificationId: string;
        result: string;
        checks: Record<string, unknown>;
    }>;
    getConsentHistory(holderId: string): Promise<(Omit<import("../../database/schemas").ConsentRecordDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "_id"> & {
        id: string;
    })[]>;
}
//# sourceMappingURL=wallet.service.d.ts.map