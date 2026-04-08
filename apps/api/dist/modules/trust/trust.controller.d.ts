import { ConfigService } from '@nestjs/config';
import { TrustService } from './trust.service';
import { IssuerService } from '../issuer/issuer.service';
import { AuthService } from '../auth/auth.service';
import { DidService } from '../did/did.service';
declare class RegisterIssuerDto {
    did: string;
    name: string;
    credentialTypes: string[];
    description?: string;
}
declare class OnboardUserDto {
    name: string;
    email: string;
    role: string;
    credentialTypes?: string[];
    description?: string;
}
declare class UpdateIssuerDto {
    name?: string;
    credentialTypes?: string[];
    status?: string;
}
export declare class TrustController {
    private readonly trustService;
    private readonly issuerService;
    private readonly authService;
    private readonly didService;
    private readonly configService;
    constructor(trustService: TrustService, issuerService: IssuerService, authService: AuthService, didService: DidService, configService: ConfigService);
    listSchemas(): Promise<{
        data: import("../issuer/issuer.service").SchemaDto[];
    }>;
    listIssuers(): Promise<{
        data: (Omit<import("../../database/schemas").TrustedIssuerDocument & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }, "_id"> & {
            id: string;
        })[];
    }>;
    getMyIssuer(req: {
        user?: {
            id: string;
            role: string;
            trustedIssuerId?: string | null;
        };
    }): Promise<{
        data: {
            authorized: boolean;
            credentialTypes: never[];
            issuer: null;
        };
    } | {
        data: {
            authorized: boolean;
            credentialTypes: string[];
            issuer: {
                did: string;
                name: string;
                description: string | null;
            };
        };
    }>;
    getIssuer(did: string): Promise<{
        data: {
            trusted: boolean;
            issuer: null;
        } | {
            trusted: boolean;
            issuer: Omit<import("../../database/schemas").TrustedIssuerDocument & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            }, "_id"> & {
                id: string;
            };
        };
    }>;
    registerIssuer(dto: RegisterIssuerDto): Promise<{
        data: Omit<import("../../database/schemas").TrustedIssuerDocument & Required<{
            _id: import("mongoose").Types.ObjectId;
        }> & {
            __v: number;
        }, "_id"> & {
            id: string;
        };
    }>;
    updateIssuer(did: string, dto: UpdateIssuerDto): Promise<{
        data: {
            updated: boolean;
        };
    }>;
    removeIssuer(did: string): Promise<{
        data: {
            removed: boolean;
        };
    }>;
    onboardUser(dto: OnboardUserDto): Promise<{
        data: {
            user: {
                email: string;
                name: string;
                role: string;
            };
            temporaryPassword: string;
            did: string | null;
            issuer: (Omit<import("../../database/schemas").TrustedIssuerDocument & Required<{
                _id: import("mongoose").Types.ObjectId;
            }> & {
                __v: number;
            }, "_id"> & {
                id: string;
            }) | null;
        };
    }>;
    verifyTrust(issuerDid: string, credentialType: string): Promise<{
        data: {
            trusted: boolean;
            reason?: string;
        };
    }>;
}
export {};
//# sourceMappingURL=trust.controller.d.ts.map