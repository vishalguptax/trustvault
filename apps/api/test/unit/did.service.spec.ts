import { describe, it, expect, beforeEach } from 'vitest';
import { DidKeyProvider } from '../../src/modules/did/providers/did-key.provider';

describe('DidKeyProvider', () => {
  let provider: DidKeyProvider;

  beforeEach(() => {
    provider = new DidKeyProvider();
  });

  describe('generateKeyPair', () => {
    it('should generate an ES256 key pair', async () => {
      const keyPair = await provider.generateKeyPair();

      expect(keyPair).toBeDefined();
      expect(keyPair.algorithm).toBe('ES256');
      expect(keyPair.kid).toBeDefined();
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.publicKey.kty).toBe('EC');
      expect(keyPair.publicKey.crv).toBe('P-256');
      expect(keyPair.privateKey.d).toBeDefined();
    });

    it('should generate unique key pairs', async () => {
      const keyPair1 = await provider.generateKeyPair();
      const keyPair2 = await provider.generateKeyPair();

      expect(keyPair1.kid).not.toBe(keyPair2.kid);
      expect(keyPair1.publicKey.x).not.toBe(keyPair2.publicKey.x);
    });
  });

  describe('createDid', () => {
    it('should create a did:key DID from a key pair', async () => {
      const keyPair = await provider.generateKeyPair();
      const { did, document } = await provider.createDid(keyPair);

      expect(did).toMatch(/^did:key:z/);
      expect(document).toBeDefined();
      expect(document.id).toBe(did);
      expect(document['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(document.verificationMethod).toHaveLength(1);
      expect(document.verificationMethod[0].type).toBe('JsonWebKey2020');
      expect(document.verificationMethod[0].publicKeyJwk).toBeDefined();
      expect(document.authentication).toHaveLength(1);
      expect(document.assertionMethod).toHaveLength(1);
    });

    it('should produce a DID with correct verification method', async () => {
      const keyPair = await provider.generateKeyPair();
      const { did, document } = await provider.createDid(keyPair);

      const vm = document.verificationMethod[0];
      expect(vm.controller).toBe(did);
      expect(vm.publicKeyJwk.kty).toBe('EC');
      expect(vm.publicKeyJwk.crv).toBe('P-256');
    });
  });

  describe('extractPublicKeyFromDocument', () => {
    it('should extract the public key from a DID document', async () => {
      const keyPair = await provider.generateKeyPair();
      const { document } = await provider.createDid(keyPair);

      const publicKey = provider.extractPublicKeyFromDocument(document);
      expect(publicKey).toBeDefined();
      expect(publicKey?.kty).toBe('EC');
      expect(publicKey?.crv).toBe('P-256');
    });
  });
});
