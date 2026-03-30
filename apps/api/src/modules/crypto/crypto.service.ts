import { Injectable } from '@nestjs/common';
import * as jose from 'jose';
import type { JWK } from 'jose';
import { KeyManagerService } from './key-manager.service';

@Injectable()
export class CryptoService {
  constructor(private readonly keyManager: KeyManagerService) {}

  async signJwt(
    payload: jose.JWTPayload,
    privateKeyJwk: JWK,
    header?: Record<string, unknown>,
  ): Promise<string> {
    return this.keyManager.signJwt(payload, privateKeyJwk, header);
  }

  async verifyJwt(
    jwt: string,
    publicKeyJwk: JWK,
  ): Promise<jose.JWTPayload> {
    const result = await this.keyManager.verifyJwt(jwt, publicKeyJwk);
    return result.payload;
  }

  generateRandomString(length: number = 32): string {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return Buffer.from(bytes).toString('base64url');
  }

  async hashSha256(data: string): Promise<string> {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256').update(data).digest();
    return Buffer.from(hash).toString('base64url');
  }
}
