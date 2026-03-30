import { Injectable, NotFoundException } from '@nestjs/common';
import type { JWK } from 'jose';
import { PrismaService } from '../../prisma/prisma.service';
import { DidKeyProvider } from './providers/did-key.provider';
import type { DidDocument, KeyPair } from '../../common/types';

export interface CreateDidResult {
  did: string;
  method: string;
  document: DidDocument;
  keyPair: KeyPair;
}

@Injectable()
export class DidService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly didKeyProvider: DidKeyProvider,
  ) {}

  async createDid(method: string = 'key'): Promise<CreateDidResult> {
    if (method !== 'key') {
      throw new Error(`Unsupported DID method: ${method}. Only "key" is supported in prototype.`);
    }

    const keyPair = await this.didKeyProvider.generateKeyPair();
    const { did, document } = await this.didKeyProvider.createDid(keyPair);

    await this.prisma.did.create({
      data: {
        did,
        method,
        document: JSON.parse(JSON.stringify(document)),
        keys: [
          {
            kid: keyPair.kid,
            type: keyPair.algorithm,
            publicKeyJwk: JSON.parse(JSON.stringify(keyPair.publicKey)),
            privateKeyJwk: JSON.parse(JSON.stringify(keyPair.privateKey)),
            purposes: ['authentication', 'assertionMethod'],
          },
        ],
        active: true,
      },
    });

    return { did, method, document, keyPair };
  }

  async resolveDid(did: string): Promise<DidDocument> {
    const record = await this.prisma.did.findUnique({ where: { did } });
    if (!record) {
      throw new NotFoundException(`DID not found: ${did}`);
    }
    return record.document as unknown as DidDocument;
  }

  async getKeyPair(did: string): Promise<KeyPair> {
    const record = await this.prisma.did.findUnique({ where: { did } });
    if (!record) {
      throw new NotFoundException(`DID not found: ${did}`);
    }

    const key = record.keys[0];
    if (!key) {
      throw new NotFoundException(`No keys found for DID: ${did}`);
    }

    return {
      publicKey: key.publicKeyJwk as unknown as JWK,
      privateKey: key.privateKeyJwk as unknown as JWK,
      kid: key.kid,
      algorithm: key.type,
    };
  }

  async getPublicKey(did: string): Promise<JWK> {
    const document = await this.resolveDid(did);
    const publicKey = this.didKeyProvider.extractPublicKeyFromDocument(document);
    if (!publicKey) {
      throw new NotFoundException(`No public key found for DID: ${did}`);
    }
    return publicKey;
  }

  async listDids(): Promise<{ did: string; method: string; active: boolean; createdAt: Date }[]> {
    const records = await this.prisma.did.findMany({
      select: { did: true, method: true, active: true, createdAt: true },
    });
    return records;
  }
}
