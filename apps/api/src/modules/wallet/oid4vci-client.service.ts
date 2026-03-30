import { Injectable, BadRequestException } from '@nestjs/common';
import type { JWK } from 'jose';
import * as jose from 'jose';
import { PrismaService } from '../../prisma/prisma.service';
import { DidService } from '../did/did.service';
import { KeyManagerService } from '../crypto/key-manager.service';
import { SIGNING_ALGORITHM } from '../../common/constants';

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

@Injectable()
export class Oid4vciClientService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly didService: DidService,
    private readonly keyManager: KeyManagerService,
  ) {}

  parseOfferUri(credentialOfferUri: string): CredentialOfferPayload {
    try {
      const url = new URL(credentialOfferUri);
      const offerParam = url.searchParams.get('credential_offer');
      if (!offerParam) {
        throw new Error('Missing credential_offer parameter');
      }
      return JSON.parse(offerParam) as CredentialOfferPayload;
    } catch (error) {
      throw new BadRequestException(
        `Invalid credential offer URI: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  async exchangeCodeForToken(
    tokenEndpoint: string,
    preAuthorizedCode: string,
    pin?: string,
  ): Promise<{
    access_token: string;
    c_nonce: string;
    c_nonce_expires_in: number;
  }> {
    const body: Record<string, string> = {
      grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
      'pre-authorized_code': preAuthorizedCode,
    };
    if (pin) {
      body.pin = pin;
    }

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Token exchange failed: ${error}`);
    }

    return response.json() as Promise<{ access_token: string; c_nonce: string; c_nonce_expires_in: number }>;
  }

  async createHolderProof(
    holderDid: string,
    holderPrivateKey: JWK,
    cNonce: string,
    audience: string,
  ): Promise<string> {
    const key = await this.keyManager.importPrivateKey(holderPrivateKey);

    const publicJwk = { ...holderPrivateKey };
    delete publicJwk.d;

    const jwt = await new jose.SignJWT({
      nonce: cNonce,
    })
      .setProtectedHeader({
        alg: SIGNING_ALGORITHM,
        typ: 'openid4vci-proof+jwt',
        jwk: publicJwk,
      })
      .setIssuer(holderDid)
      .setAudience(audience)
      .setIssuedAt()
      .sign(key);

    return jwt;
  }

  async requestCredential(
    credentialEndpoint: string,
    accessToken: string,
    format: string,
    credentialType: string,
    proofJwt?: string,
  ): Promise<{ credential: string; c_nonce?: string }> {
    const body: Record<string, unknown> = {
      format,
      credential_definition: { type: [credentialType] },
    };

    if (proofJwt) {
      body.proof = { proof_type: 'jwt', jwt: proofJwt };
    }

    const response = await fetch(credentialEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new BadRequestException(`Credential request failed: ${error}`);
    }

    return response.json() as Promise<{ credential: string; c_nonce?: string }>;
  }
}
