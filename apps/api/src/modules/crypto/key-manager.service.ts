import { Injectable } from '@nestjs/common';
import * as jose from 'jose';
import type { JWK } from 'jose';
import { SIGNING_ALGORITHM } from '../../common/constants';

@Injectable()
export class KeyManagerService {
  async importPrivateKey(jwk: JWK): Promise<jose.KeyLike> {
    return (await jose.importJWK(jwk, SIGNING_ALGORITHM)) as jose.KeyLike;
  }

  async importPublicKey(jwk: JWK): Promise<jose.KeyLike> {
    const publicJwk = { ...jwk };
    delete publicJwk.d;
    return (await jose.importJWK(publicJwk, SIGNING_ALGORITHM)) as jose.KeyLike;
  }

  async signJwt(
    payload: jose.JWTPayload,
    privateKeyJwk: JWK,
    header?: Record<string, unknown>,
  ): Promise<string> {
    const privateKey = await this.importPrivateKey(privateKeyJwk);

    return new jose.SignJWT(payload)
      .setProtectedHeader({ alg: SIGNING_ALGORITHM, ...header })
      .sign(privateKey);
  }

  async verifyJwt(
    jwt: string,
    publicKeyJwk: JWK,
  ): Promise<{ payload: jose.JWTPayload; protectedHeader: jose.JWTHeaderParameters }> {
    const publicKey = await this.importPublicKey(publicKeyJwk);
    return jose.jwtVerify(jwt, publicKey, { algorithms: [SIGNING_ALGORITHM] });
  }

  async calculateThumbprint(jwk: JWK): Promise<string> {
    return jose.calculateJwkThumbprint(jwk, 'sha256');
  }
}
