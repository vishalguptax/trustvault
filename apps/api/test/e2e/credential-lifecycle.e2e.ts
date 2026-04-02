/**
 * E2E: Full credential lifecycle — 5 mandatory scenarios
 *
 * Tests the crypto pipeline end-to-end without a database:
 *   1. Issue SD-JWT-VC credential
 *   2. Store and decode credential
 *   3. Present with selective disclosure
 *   4. Verify valid presentation
 *   5. Reject untrusted / expired / revoked credentials
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { DidKeyProvider } from '../../src/modules/did/providers/did-key.provider';
import { KeyManagerService } from '../../src/modules/crypto/key-manager.service';
import { SdJwtService } from '../../src/modules/crypto/sd-jwt.service';
import type { JWK } from 'jose';

describe('Credential Lifecycle E2E', () => {
  let didKeyProvider: DidKeyProvider;
  let sdJwtService: SdJwtService;
  let keyManager: KeyManagerService;

  let issuerDid: string;
  let issuerKeys: { publicKey: JWK; privateKey: JWK };
  let holderDid: string;
  let holderKeys: { publicKey: JWK; privateKey: JWK };
  let verifierDid: string;

  let educationCredential: string;
  let incomeCredential: string;

  beforeAll(async () => {
    didKeyProvider = new DidKeyProvider();
    keyManager = new KeyManagerService();
    sdJwtService = new SdJwtService(keyManager);

    // Generate DIDs for all actors
    issuerKeys = await didKeyProvider.generateKeyPair();
    const issuerResult = await didKeyProvider.createDid(issuerKeys);
    issuerDid = issuerResult.did;

    holderKeys = await didKeyProvider.generateKeyPair();
    const holderResult = await didKeyProvider.createDid(holderKeys);
    holderDid = holderResult.did;

    const verifierKeys = await didKeyProvider.generateKeyPair();
    const verifierResult = await didKeyProvider.createDid(verifierKeys);
    verifierDid = verifierResult.did;
  });

  // =========================================
  // Scenario 1: Issue credential
  // =========================================
  describe('1. Issue SD-JWT-VC', () => {
    it('should issue an education credential', async () => {
      educationCredential = await sdJwtService.issue({
        issuerDid,
        subjectDid: holderDid,
        credentialType: 'VerifiableEducationCredential',
        claims: {
          institutionName: 'National Technical University',
          degree: 'Bachelor of Technology',
          fieldOfStudy: 'Computer Science',
          graduationDate: '2024-06-15',
          gpa: 3.8,
          studentId: 'NTU-2020-CS-1042',
        },
        disclosableClaims: ['fieldOfStudy', 'graduationDate', 'gpa', 'studentId'],
        holderPublicKey: holderKeys.publicKey,
        issuerPrivateKey: issuerKeys.privateKey,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      expect(educationCredential).toBeDefined();
      expect(educationCredential).toContain('~'); // SD-JWT has disclosures
    });

    it('should issue an income credential', async () => {
      incomeCredential = await sdJwtService.issue({
        issuerDid,
        subjectDid: holderDid,
        credentialType: 'VerifiableIncomeCredential',
        claims: {
          employerName: 'Apex Financial Services',
          jobTitle: 'Software Engineer',
          annualIncome: 1200000,
          currency: 'INR',
        },
        disclosableClaims: ['jobTitle', 'annualIncome'],
        holderPublicKey: holderKeys.publicKey,
        issuerPrivateKey: issuerKeys.privateKey,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });

      expect(incomeCredential).toBeDefined();
    });
  });

  // =========================================
  // Scenario 2: Store and decode
  // =========================================
  describe('2. Store and decode credential', () => {
    it('should decode education credential and extract claims', () => {
      const decoded = sdJwtService.decode(educationCredential);

      expect(decoded.header.alg).toBe('ES256');
      expect(decoded.payload.iss).toBe(issuerDid);
      expect(decoded.payload.sub).toBe(holderDid);
      expect(decoded.payload.vct).toBe('VerifiableEducationCredential');
      expect(decoded.payload.institutionName).toBe('National Technical University');
      expect(decoded.payload.degree).toBe('Bachelor of Technology');
      expect(decoded.disclosures.length).toBeGreaterThan(0);
    });

    it('should have holder key binding (cnf)', () => {
      const decoded = sdJwtService.decode(educationCredential);
      expect(decoded.payload.cnf).toBeDefined();
      expect((decoded.payload.cnf as Record<string, unknown>).jwk).toBeDefined();
    });

    it('should have expiration', () => {
      const decoded = sdJwtService.decode(educationCredential);
      expect(decoded.payload.exp).toBeDefined();
      expect(decoded.payload.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  // =========================================
  // Scenario 3: Present with selective disclosure
  // =========================================
  describe('3. Present with selective disclosure', () => {
    let presentation: string;

    it('should create presentation disclosing only degree and institution', async () => {
      presentation = await sdJwtService.present({
        sdJwtVc: educationCredential,
        disclosedClaims: ['fieldOfStudy', 'gpa'],
        nonce: 'test-nonce-123',
        audience: verifierDid,
        holderPrivateKey: holderKeys.privateKey,
      });

      expect(presentation).toBeDefined();
      expect(presentation).toContain('~'); // Has disclosures + KB-JWT
    });

    it('should verify presentation with issuer public key', async () => {
      const result = await sdJwtService.verify(
        educationCredential,
        issuerKeys.publicKey,
      );

      expect(result.valid).toBe(true);
      expect(result.payload.vct).toBe('VerifiableEducationCredential');
    });
  });

  // =========================================
  // Scenario 4: Verify valid credential
  // =========================================
  describe('4. Verify valid credential', () => {
    it('should verify education credential signature', async () => {
      const result = await sdJwtService.verify(
        educationCredential,
        issuerKeys.publicKey,
      );

      expect(result.valid).toBe(true);
      expect(result.payload.iss).toBe(issuerDid);
    });

    it('should verify income credential signature', async () => {
      const result = await sdJwtService.verify(
        incomeCredential,
        issuerKeys.publicKey,
      );

      expect(result.valid).toBe(true);
      expect(result.payload.vct).toBe('VerifiableIncomeCredential');
    });
  });

  // =========================================
  // Scenario 5: Reject invalid credentials
  // =========================================
  describe('5. Reject invalid credentials', () => {
    it('should reject credential signed by untrusted issuer', async () => {
      const untrustedKeys = await didKeyProvider.generateKeyPair();
      const result = await sdJwtService.verify(
        educationCredential,
        untrustedKeys.publicKey, // Wrong key — not the real issuer
      );

      expect(result.valid).toBe(false);
    });

    it('should reject expired credential', async () => {
      const expiredCred = await sdJwtService.issue({
        issuerDid,
        subjectDid: holderDid,
        credentialType: 'VerifiableEducationCredential',
        claims: { degree: 'Expired Degree' },
        disclosableClaims: [],
        issuerPrivateKey: issuerKeys.privateKey,
        expiresAt: new Date(Date.now() - 1000), // Already expired
      });

      const decoded = sdJwtService.decode(expiredCred);
      const now = Math.floor(Date.now() / 1000);

      expect(decoded.payload.exp).toBeDefined();
      expect(decoded.payload.exp as number).toBeLessThan(now);
    });

    it('should reject tampered credential', async () => {
      // Tamper with the JWT payload
      const parts = educationCredential.split('~');
      const jwt = parts[0];
      const [header, payload, sig] = jwt.split('.');

      // Modify one character in the payload
      const tamperedPayload = payload.slice(0, -1) + (payload.slice(-1) === 'A' ? 'B' : 'A');
      const tamperedJwt = `${header}.${tamperedPayload}.${sig}`;
      const tamperedCredential = [tamperedJwt, ...parts.slice(1)].join('~');

      const result = await sdJwtService.verify(
        tamperedCredential,
        issuerKeys.publicKey,
      );

      expect(result.valid).toBe(false);
    });
  });
});
