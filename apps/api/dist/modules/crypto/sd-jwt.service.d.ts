import type { JWK } from 'jose';
import { KeyManagerService } from './key-manager.service';
export interface SdJwtIssueOptions {
    issuerDid: string;
    subjectDid: string;
    credentialType: string;
    claims: Record<string, unknown>;
    disclosableClaims: string[];
    holderPublicKey?: JWK;
    issuerPrivateKey: JWK;
    expiresAt?: Date;
    statusListUri?: string;
    statusListIndex?: number;
}
export interface SdJwtVerifyResult {
    valid: boolean;
    payload: Record<string, unknown>;
    disclosedClaims: Record<string, unknown>;
    error?: string;
}
export interface SdJwtPresentOptions {
    sdJwtVc: string;
    disclosedClaims: string[];
    nonce: string;
    audience: string;
    holderPrivateKey: JWK;
}
export declare class SdJwtService {
    private readonly keyManager;
    constructor(keyManager: KeyManagerService);
    private createSigner;
    private createVerifier;
    private createInstance;
    issue(options: SdJwtIssueOptions): Promise<string>;
    verify(sdJwtVc: string, issuerPublicKey: JWK, requiredClaims?: string[]): Promise<SdJwtVerifyResult>;
    present(options: SdJwtPresentOptions): Promise<string>;
    decode(sdJwtVc: string): {
        header: Record<string, unknown>;
        payload: Record<string, unknown>;
        disclosures: string[];
    };
}
//# sourceMappingURL=sd-jwt.service.d.ts.map