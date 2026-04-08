import type { JWK } from 'jose';
import { DidService } from '../did/did.service';
import { KeyManagerService } from '../crypto/key-manager.service';
interface CredentialOfferPayload {
    credential_issuer: string;
    credential_configuration_ids: string[];
    grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': string;
            user_pin_required?: boolean;
        };
    };
    subject_did?: string;
}
export declare class Oid4vciClientService {
    private readonly didService;
    private readonly keyManager;
    constructor(didService: DidService, keyManager: KeyManagerService);
    parseOfferUri(credentialOfferUri: string): CredentialOfferPayload;
    /**
     * Unwrap the global response interceptor's { data: ... } wrapper.
     * Internal API calls hit the same server, so responses arrive wrapped.
     */
    private unwrap;
    exchangeCodeForToken(tokenEndpoint: string, preAuthorizedCode: string, pin?: string): Promise<{
        access_token: string;
        c_nonce: string;
        c_nonce_expires_in: number;
    }>;
    createHolderProof(holderDid: string, holderPrivateKey: JWK, cNonce: string, audience: string): Promise<string>;
    requestCredential(credentialEndpoint: string, accessToken: string, format: string, credentialType: string, proofJwt?: string): Promise<{
        credential: string;
        c_nonce?: string;
    }>;
}
export {};
//# sourceMappingURL=oid4vci-client.service.d.ts.map