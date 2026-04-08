import * as jose from 'jose';
import type { JWK } from 'jose';
export declare class KeyManagerService {
    importPrivateKey(jwk: JWK): Promise<jose.KeyLike>;
    importPublicKey(jwk: JWK): Promise<jose.KeyLike>;
    signJwt(payload: jose.JWTPayload, privateKeyJwk: JWK, header?: Record<string, unknown>): Promise<string>;
    verifyJwt(jwt: string, publicKeyJwk: JWK): Promise<{
        payload: jose.JWTPayload;
        protectedHeader: jose.JWTHeaderParameters;
    }>;
    calculateThumbprint(jwk: JWK): Promise<string>;
}
//# sourceMappingURL=key-manager.service.d.ts.map