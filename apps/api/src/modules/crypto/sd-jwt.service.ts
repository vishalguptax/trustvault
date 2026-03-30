import { Injectable } from '@nestjs/common';
import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import type { DisclosureFrame, Signer, Verifier, KbVerifier, Hasher } from '@sd-jwt/types';
import * as jose from 'jose';
import type { JWK } from 'jose';
import { createHash, randomBytes } from 'crypto';
import { SIGNING_ALGORITHM } from '../../common/constants';
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

const hasher: Hasher = (data: string, alg: string): Uint8Array => {
  const algorithm = alg === 'sha-256' ? 'sha256' : alg;
  const hash = createHash(algorithm).update(data).digest();
  return new Uint8Array(hash);
};

const saltGenerator = (): string => {
  return randomBytes(16).toString('base64url');
};

@Injectable()
export class SdJwtService {
  constructor(private readonly keyManager: KeyManagerService) {}

  private createSigner(privateKeyJwk: JWK): Signer {
    return async (data: string): Promise<string> => {
      const key = await this.keyManager.importPrivateKey(privateKeyJwk);
      const parts = data.split('.');
      if (parts.length !== 2) {
        throw new Error('Invalid data format for signing');
      }
      const payload = Buffer.from(parts[1], 'base64url');
      const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());

      const jws = await new jose.CompactSign(payload)
        .setProtectedHeader(header)
        .sign(key);

      return jws.split('.')[2];
    };
  }

  private createVerifier(publicKeyJwk: JWK): Verifier {
    return async (data: string, signature: string): Promise<boolean> => {
      try {
        const key = await this.keyManager.importPublicKey(publicKeyJwk);
        await jose.compactVerify(`${data}.${signature}`, key);
        return true;
      } catch {
        return false;
      }
    };
  }

  private createInstance(
    privateKeyJwk?: JWK,
    publicKeyJwk?: JWK,
    kbPrivateKeyJwk?: JWK,
    kbPublicKeyJwk?: JWK,
  ): SDJwtVcInstance {
    const signer = privateKeyJwk ? this.createSigner(privateKeyJwk) : undefined;
    const verifier = publicKeyJwk ? this.createVerifier(publicKeyJwk) : undefined;
    const kbSigner = kbPrivateKeyJwk ? this.createSigner(kbPrivateKeyJwk) : undefined;

    const kbVerifier: KbVerifier | undefined = kbPublicKeyJwk
      ? async (data: string, signature: string): Promise<boolean> => {
          try {
            const key = await this.keyManager.importPublicKey(kbPublicKeyJwk);
            await jose.compactVerify(`${data}.${signature}`, key);
            return true;
          } catch {
            return false;
          }
        }
      : undefined;

    return new SDJwtVcInstance({
      hasher,
      hashAlg: 'sha-256',
      saltGenerator,
      signAlg: SIGNING_ALGORITHM,
      signer,
      verifier,
      kbSigner,
      kbSignAlg: kbPrivateKeyJwk ? SIGNING_ALGORITHM : undefined,
      kbVerifier,
    });
  }

  async issue(options: SdJwtIssueOptions): Promise<string> {
    const instance = this.createInstance(options.issuerPrivateKey);

    const payload: Record<string, unknown> = {
      iss: options.issuerDid,
      sub: options.subjectDid,
      vct: options.credentialType,
      iat: Math.floor(Date.now() / 1000),
      ...options.claims,
    };

    if (options.expiresAt) {
      payload.exp = Math.floor(options.expiresAt.getTime() / 1000);
    }

    if (options.holderPublicKey) {
      payload.cnf = { jwk: options.holderPublicKey };
    }

    if (options.statusListUri && options.statusListIndex !== undefined) {
      payload.status = {
        status_list: {
          idx: options.statusListIndex,
          uri: options.statusListUri,
        },
      };
    }

    const disclosureFrame = {
      _sd: options.disclosableClaims,
    };

    const sdJwtVc = await instance.issue(
      payload as Parameters<SDJwtVcInstance['issue']>[0],
      disclosureFrame as Parameters<SDJwtVcInstance['issue']>[1],
    );
    return sdJwtVc;
  }

  async verify(
    sdJwtVc: string,
    issuerPublicKey: JWK,
    requiredClaims?: string[],
  ): Promise<SdJwtVerifyResult> {
    try {
      const instance = this.createInstance(undefined, issuerPublicKey);
      const result = await instance.verify(sdJwtVc, requiredClaims);

      return {
        valid: true,
        payload: result.payload as unknown as Record<string, unknown>,
        disclosedClaims: result.payload as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return {
        valid: false,
        payload: {},
        disclosedClaims: {},
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  async present(options: SdJwtPresentOptions): Promise<string> {
    const instance = this.createInstance(undefined, undefined, options.holderPrivateKey);

    const presentationFrame: Record<string, boolean> = {};
    for (const claim of options.disclosedClaims) {
      presentationFrame[claim] = true;
    }

    const presented = await instance.present(
      options.sdJwtVc,
      presentationFrame as unknown as Parameters<SDJwtVcInstance['present']>[1],
      {
        kb: {
          payload: {
            aud: options.audience,
            nonce: options.nonce,
            iat: Math.floor(Date.now() / 1000),
          },
        },
      },
    );

    return presented;
  }

  decode(sdJwtVc: string): {
    header: Record<string, unknown>;
    payload: Record<string, unknown>;
    disclosures: string[];
  } {
    const parts = sdJwtVc.split('~');
    const jwt = parts[0];
    const disclosures = parts.slice(1).filter((d) => d.length > 0);

    const [headerB64, payloadB64] = jwt.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());

    return { header, payload, disclosures };
  }
}
