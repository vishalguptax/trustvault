import * as jose from 'jose';
import type { JWK } from 'jose';
import { KeyManagerService } from './key-manager.service';
export declare class CryptoService {
    private readonly keyManager;
    constructor(keyManager: KeyManagerService);
    signJwt(payload: jose.JWTPayload, privateKeyJwk: JWK, header?: Record<string, unknown>): Promise<string>;
    verifyJwt(jwt: string, publicKeyJwk: JWK): Promise<jose.JWTPayload>;
    generateRandomString(length?: number): string;
    hashSha256(data: string): Promise<string>;
}
//# sourceMappingURL=crypto.service.d.ts.map