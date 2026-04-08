import { IssuerService } from './issuer.service';
import { CreateOfferDto } from './dto/create-offer.dto';
import { CreateBulkOffersDto } from './dto/bulk-offer.dto';
import { TokenRequestDto } from './dto/token-request.dto';
import { CredentialRequestDto } from './dto/credential-request.dto';
export declare class IssuerController {
    private readonly issuerService;
    constructor(issuerService: IssuerService);
    getMetadata(): Promise<{
        data: Record<string, unknown>;
    }>;
    createOffer(dto: CreateOfferDto, req: {
        user?: {
            id: string;
        };
    }): Promise<{
        data: {
            offerId: string;
            credentialOfferUri: string;
            preAuthorizedCode: string;
        };
    }>;
    createBulkOffers(dto: CreateBulkOffersDto, req: {
        user?: {
            id: string;
        };
    }): Promise<{
        data: {
            total: number;
            successful: number;
            failed: number;
            results: {
                index: number;
                offerId?: string;
                credentialOfferUri?: string;
                error?: string;
            }[];
        };
    }>;
    exchangeToken(dto: TokenRequestDto): Promise<{
        data: {
            access_token: string;
            token_type: string;
            expires_in: number;
            c_nonce: string;
            c_nonce_expires_in: number;
        };
    }>;
    issueCredential(authHeader: string, dto: CredentialRequestDto): Promise<{
        data: {
            credential: string;
            c_nonce: string;
            c_nonce_expires_in: number;
        };
    }>;
    listOffers(): Promise<{
        data: {
            id: string;
            schemaTypeUri: string;
            status: string;
            claims: Record<string, unknown>;
            credentialOfferUri: string | null;
            preAuthorizedCode: string;
            createdAt: Date;
            expiresAt: Date;
        }[];
    }>;
    listSchemas(): Promise<{
        data: import("./issuer.service").SchemaDto[];
    }>;
    getSchema(id: string): Promise<{
        data: import("./issuer.service").SchemaDto;
    }>;
    getOfferPreview(code: string): Promise<{
        data: {
            issuerName: string | null;
            issuerDid: string;
            credentialType: string;
            credentialTypeName: string;
            documentName: string;
            claims: string[];
            claimValues: Record<string, unknown>;
            status: string;
            expiresAt: Date;
        };
    }>;
    listCredentials(): Promise<{
        data: {
            id: string;
            type: string;
            subjectDid: string;
            issuerDid: string;
            status: string;
            issuedAt: Date;
            expiresAt: Date | null;
        }[];
    }>;
}
//# sourceMappingURL=issuer.controller.d.ts.map