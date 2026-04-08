import { DatabaseService } from '../../database/database.service';
export declare class TrustService {
    private readonly db;
    constructor(db: DatabaseService);
    registerIssuer(did: string, name: string, credentialTypes: string[], description?: string): Promise<Omit<import("../../database/schemas").TrustedIssuerDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "_id"> & {
        id: string;
    }>;
    listIssuers(): Promise<(Omit<import("../../database/schemas").TrustedIssuerDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "_id"> & {
        id: string;
    })[]>;
    getIssuer(did: string): Promise<{
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
    }>;
    updateIssuer(did: string, updates: {
        name?: string;
        credentialTypes?: string[];
        status?: string;
    }): Promise<{
        updated: boolean;
    }>;
    removeIssuer(did: string): Promise<{
        removed: boolean;
    }>;
    /** Link a user account to a trusted issuer entry */
    linkUserToIssuer(email: string, trustedIssuerId: string): Promise<void>;
    /** Get the trusted issuer entry for a user by their trustedIssuerId */
    getIssuerForUser(trustedIssuerId: string): Promise<(Omit<import("../../database/schemas").TrustedIssuerDocument & Required<{
        _id: import("mongoose").Types.ObjectId;
    }> & {
        __v: number;
    }, "_id"> & {
        id: string;
    }) | null>;
    verifyTrust(issuerDid: string, credentialType: string): Promise<{
        trusted: boolean;
        reason?: string;
    }>;
}
//# sourceMappingURL=trust.service.d.ts.map