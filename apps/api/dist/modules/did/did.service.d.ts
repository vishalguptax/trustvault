import type { JWK } from 'jose';
import { DatabaseService } from '../../database/database.service';
import { DidKeyProvider } from './providers/did-key.provider';
import type { DidDocument, KeyPair } from '../../common/types';
export interface CreateDidResult {
    did: string;
    method: string;
    document: DidDocument;
    keyPair: KeyPair;
}
export declare class DidService {
    private readonly db;
    private readonly didKeyProvider;
    constructor(db: DatabaseService, didKeyProvider: DidKeyProvider);
    createDid(method?: string): Promise<CreateDidResult>;
    resolveDid(did: string): Promise<DidDocument>;
    getKeyPair(did: string): Promise<KeyPair>;
    getPublicKey(did: string): Promise<JWK>;
    listDids(): Promise<{
        did: string;
        method: string;
        active: boolean;
        createdAt: Date;
    }[]>;
}
//# sourceMappingURL=did.service.d.ts.map