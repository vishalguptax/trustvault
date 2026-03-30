import type { JWK } from 'jose';

export interface DidDocument {
  '@context': string[];
  id: string;
  verificationMethod: VerificationMethod[];
  authentication: string[];
  assertionMethod: string[];
}

export interface VerificationMethod {
  id: string;
  type: string;
  controller: string;
  publicKeyJwk: JWK;
}

export interface DidResolutionResult {
  didDocument: DidDocument | null;
  didResolutionMetadata: Record<string, unknown>;
  didDocumentMetadata: Record<string, unknown>;
}

export interface KeyPair {
  publicKey: JWK;
  privateKey: JWK;
  kid: string;
  algorithm: string;
}
