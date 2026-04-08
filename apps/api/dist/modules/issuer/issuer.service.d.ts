import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { DidService } from '../did/did.service';
import { SdJwtService } from '../crypto/sd-jwt.service';
interface ClaimDefinitionDto {
    key: string;
    label: string;
    type: string;
    required: boolean;
    selectivelyDisclosable: boolean;
}
export interface SchemaDto {
    id: string;
    type: string;
    name: string;
    description: string;
    claims: ClaimDefinitionDto[];
}
interface CredentialSchemaLean {
    _id: unknown;
    typeUri: string;
    name: string;
    description: string | null;
    schema: Record<string, unknown>;
    sdClaims: string[];
}
export declare class IssuerService {
    private readonly db;
    private readonly didService;
    private readonly sdJwtService;
    private readonly configService;
    constructor(db: DatabaseService, didService: DidService, sdJwtService: SdJwtService, configService: ConfigService);
    getOrCreateIssuerDid(): Promise<string>;
    getIssuerMetadata(): Promise<Record<string, unknown>>;
    /**
     * Verify that the calling user is authorized to issue the given credential type.
     * Admins bypass this check. Issuers must be linked to a trusted issuer entry
     * that includes the requested credential type.
     */
    verifyIssuerAuthorization(userId: string, schemaTypeUri: string): Promise<void>;
    createOffer(schemaTypeUri: string, subjectDid: string, claims: Record<string, unknown>, pinRequired?: boolean, userId?: string): Promise<{
        offerId: string;
        credentialOfferUri: string;
        preAuthorizedCode: string;
    }>;
    createBulkOffers(schemaTypeUri: string, offers: Array<{
        claims: Record<string, unknown>;
    }>, userId?: string): Promise<{
        total: number;
        successful: number;
        failed: number;
        results: {
            index: number;
            offerId?: string;
            credentialOfferUri?: string;
            error?: string;
        }[];
    }>;
    exchangeToken(preAuthorizedCode: string, pin?: string): Promise<{
        access_token: string;
        token_type: string;
        expires_in: number;
        c_nonce: string;
        c_nonce_expires_in: number;
    }>;
    issueCredential(accessToken: string, format: string, credentialDefinition: {
        type: string[];
    }, proof?: {
        proof_type: string;
        jwt: string;
    }): Promise<{
        credential: string;
        c_nonce: string;
        c_nonce_expires_in: number;
    }>;
    toSchemaDto(schema: CredentialSchemaLean): SchemaDto;
    listSchemas(): Promise<SchemaDto[]>;
    getSchema(id: string): Promise<SchemaDto>;
    getOfferPreview(preAuthorizedCode: string): Promise<{
        issuerName: string | null;
        issuerDid: string;
        credentialType: string;
        credentialTypeName: string;
        documentName: string;
        claims: string[];
        claimValues: Record<string, unknown>;
        status: string;
        expiresAt: Date;
    }>;
    listOffers(): Promise<{
        id: string;
        schemaTypeUri: string;
        status: string;
        claims: Record<string, unknown>;
        credentialOfferUri: string | null;
        preAuthorizedCode: string;
        createdAt: Date;
        expiresAt: Date;
    }[]>;
    listIssuedCredentials(issuerDid?: string): Promise<{
        id: string;
        type: string;
        subjectDid: string;
        issuerDid: string;
        status: string;
        issuedAt: Date;
        expiresAt: Date | null;
    }[]>;
}
export {};
//# sourceMappingURL=issuer.service.d.ts.map