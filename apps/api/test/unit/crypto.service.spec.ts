import { describe, it, expect, beforeEach } from 'vitest';
import { KeyManagerService } from '../../src/modules/crypto/key-manager.service';
import { CryptoService } from '../../src/modules/crypto/crypto.service';
import { SdJwtService } from '../../src/modules/crypto/sd-jwt.service';
import { DidKeyProvider } from '../../src/modules/did/providers/did-key.provider';

describe('KeyManagerService', () => {
  let keyManager: KeyManagerService;
  let didKeyProvider: DidKeyProvider;

  beforeEach(() => {
    keyManager = new KeyManagerService();
    didKeyProvider = new DidKeyProvider();
  });

  describe('signJwt / verifyJwt', () => {
    it('should sign and verify a JWT with ES256', async () => {
      const keyPair = await didKeyProvider.generateKeyPair();

      const payload = { sub: 'test-subject', iss: 'test-issuer', data: 'hello' };
      const jwt = await keyManager.signJwt(payload, keyPair.privateKey);

      expect(jwt).toBeDefined();
      expect(jwt.split('.')).toHaveLength(3);

      const result = await keyManager.verifyJwt(jwt, keyPair.publicKey);
      expect(result.payload.sub).toBe('test-subject');
      expect(result.payload.iss).toBe('test-issuer');
    });

    it('should reject a JWT signed with a different key', async () => {
      const keyPair1 = await didKeyProvider.generateKeyPair();
      const keyPair2 = await didKeyProvider.generateKeyPair();

      const jwt = await keyManager.signJwt({ sub: 'test' }, keyPair1.privateKey);

      await expect(keyManager.verifyJwt(jwt, keyPair2.publicKey)).rejects.toThrow();
    });
  });
});

describe('CryptoService', () => {
  let cryptoService: CryptoService;
  let didKeyProvider: DidKeyProvider;

  beforeEach(() => {
    const keyManager = new KeyManagerService();
    cryptoService = new CryptoService(keyManager);
    didKeyProvider = new DidKeyProvider();
  });

  describe('generateRandomString', () => {
    it('should generate a base64url random string', () => {
      const str = cryptoService.generateRandomString();
      expect(str).toBeDefined();
      expect(str.length).toBeGreaterThan(0);
    });

    it('should generate unique strings', () => {
      const str1 = cryptoService.generateRandomString();
      const str2 = cryptoService.generateRandomString();
      expect(str1).not.toBe(str2);
    });
  });

  describe('hashSha256', () => {
    it('should produce a consistent hash', async () => {
      const hash1 = await cryptoService.hashSha256('test data');
      const hash2 = await cryptoService.hashSha256('test data');
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', async () => {
      const hash1 = await cryptoService.hashSha256('data1');
      const hash2 = await cryptoService.hashSha256('data2');
      expect(hash1).not.toBe(hash2);
    });
  });
});

describe('SdJwtService', () => {
  let sdJwtService: SdJwtService;
  let didKeyProvider: DidKeyProvider;

  beforeEach(() => {
    const keyManager = new KeyManagerService();
    sdJwtService = new SdJwtService(keyManager);
    didKeyProvider = new DidKeyProvider();
  });

  describe('issue and verify', () => {
    it('should issue an SD-JWT-VC and verify it', async () => {
      const issuerKeyPair = await didKeyProvider.generateKeyPair();
      const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);

      const holderKeyPair = await didKeyProvider.generateKeyPair();
      const { did: holderDid } = await didKeyProvider.createDid(holderKeyPair);

      const sdJwtVc = await sdJwtService.issue({
        issuerDid,
        subjectDid: holderDid,
        credentialType: 'VerifiableEducationCredential',
        claims: {
          name: 'John Doe',
          degree: 'MSc Computer Science',
          institution: 'MIT',
          gpa: 3.9,
        },
        disclosableClaims: ['name', 'degree', 'gpa'],
        holderPublicKey: holderKeyPair.publicKey,
        issuerPrivateKey: issuerKeyPair.privateKey,
      });

      expect(sdJwtVc).toBeDefined();
      expect(sdJwtVc).toContain('~');

      const result = await sdJwtService.verify(sdJwtVc, issuerKeyPair.publicKey);
      expect(result.valid).toBe(true);
      expect(result.payload.iss).toBe(issuerDid);
      expect(result.payload.vct).toBe('VerifiableEducationCredential');
    });

    it('should fail verification with wrong public key', async () => {
      const issuerKeyPair = await didKeyProvider.generateKeyPair();
      const wrongKeyPair = await didKeyProvider.generateKeyPair();
      const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);

      const sdJwtVc = await sdJwtService.issue({
        issuerDid,
        subjectDid: 'did:key:zholder',
        credentialType: 'VerifiableEducationCredential',
        claims: { name: 'John' },
        disclosableClaims: ['name'],
        issuerPrivateKey: issuerKeyPair.privateKey,
      });

      const result = await sdJwtService.verify(sdJwtVc, wrongKeyPair.publicKey);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('decode', () => {
    it('should decode an SD-JWT-VC into its components', async () => {
      const issuerKeyPair = await didKeyProvider.generateKeyPair();
      const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);

      const sdJwtVc = await sdJwtService.issue({
        issuerDid,
        subjectDid: 'did:key:zsubject',
        credentialType: 'VerifiableEducationCredential',
        claims: {
          name: 'Jane Doe',
          degree: 'PhD',
        },
        disclosableClaims: ['name', 'degree'],
        issuerPrivateKey: issuerKeyPair.privateKey,
      });

      const decoded = sdJwtService.decode(sdJwtVc);

      expect(decoded.header.alg).toBe('ES256');
      expect(decoded.payload.iss).toBe(issuerDid);
      expect(decoded.payload.vct).toBe('VerifiableEducationCredential');
      expect(decoded.disclosures.length).toBeGreaterThan(0);
    });
  });

  describe('issue with status and expiry', () => {
    it('should include status list and expiration in the SD-JWT-VC', async () => {
      const issuerKeyPair = await didKeyProvider.generateKeyPair();
      const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);

      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

      const sdJwtVc = await sdJwtService.issue({
        issuerDid,
        subjectDid: 'did:key:zholder',
        credentialType: 'VerifiableIncomeCredential',
        claims: { annualIncome: 95000, employer: 'TechCorp' },
        disclosableClaims: ['annualIncome', 'employer'],
        issuerPrivateKey: issuerKeyPair.privateKey,
        expiresAt,
        statusListUri: 'http://localhost:3000/status/lists/abc',
        statusListIndex: 42,
      });

      const decoded = sdJwtService.decode(sdJwtVc);
      expect(decoded.payload.exp).toBeDefined();
      expect(decoded.payload.status).toBeDefined();

      const status = decoded.payload.status as { status_list: { idx: number; uri: string } };
      expect(status.status_list.idx).toBe(42);
      expect(status.status_list.uri).toBe('http://localhost:3000/status/lists/abc');
    });
  });
});
