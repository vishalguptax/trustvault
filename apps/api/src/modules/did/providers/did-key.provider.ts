import { Injectable } from '@nestjs/common';
import * as jose from 'jose';
import type { JWK } from 'jose';
import { SIGNING_ALGORITHM } from '../../../common/constants';
import type { DidDocument, KeyPair } from '../../../common/types';

@Injectable()
export class DidKeyProvider {
  async generateKeyPair(): Promise<KeyPair> {
    const { publicKey, privateKey } = await jose.generateKeyPair(SIGNING_ALGORITHM, {
      extractable: true,
    });

    const publicJwk = await jose.exportJWK(publicKey);
    const privateJwk = await jose.exportJWK(privateKey);

    const thumbprint = await jose.calculateJwkThumbprint(publicJwk, 'sha256');

    return {
      publicKey: publicJwk,
      privateKey: privateJwk,
      kid: thumbprint,
      algorithm: SIGNING_ALGORITHM,
    };
  }

  async createDid(keyPair: KeyPair): Promise<{ did: string; document: DidDocument }> {
    const jwk = { ...keyPair.publicKey };
    const thumbprint = await jose.calculateJwkThumbprint(jwk, 'sha256');

    const did = `did:key:z${thumbprint}`;
    const verificationMethodId = `${did}#${keyPair.kid}`;

    const document: DidDocument = {
      '@context': [
        'https://www.w3.org/ns/did/v1',
        'https://w3id.org/security/suites/jws-2020/v1',
      ],
      id: did,
      verificationMethod: [
        {
          id: verificationMethodId,
          type: 'JsonWebKey2020',
          controller: did,
          publicKeyJwk: jwk,
        },
      ],
      authentication: [verificationMethodId],
      assertionMethod: [verificationMethodId],
    };

    return { did, document };
  }

  async resolveDid(did: string): Promise<DidDocument | null> {
    if (!did.startsWith('did:key:')) {
      return null;
    }
    return null;
  }

  extractPublicKeyFromDocument(document: DidDocument): JWK | null {
    const vm = document.verificationMethod?.[0];
    if (!vm?.publicKeyJwk) {
      return null;
    }
    return vm.publicKeyJwk;
  }
}
