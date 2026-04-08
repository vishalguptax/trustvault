import type { JWK } from 'jose';
import type { DidDocument, KeyPair } from '../../../common/types';
export declare class DidKeyProvider {
    generateKeyPair(): Promise<KeyPair>;
    createDid(keyPair: KeyPair): Promise<{
        did: string;
        document: DidDocument;
    }>;
    resolveDid(did: string): Promise<DidDocument | null>;
    extractPublicKeyFromDocument(document: DidDocument): JWK | null;
}
//# sourceMappingURL=did-key.provider.d.ts.map