import { describe, it, expect, beforeEach } from 'vitest';
import { DidKeyProvider } from '../../src/modules/did/providers/did-key.provider';
import { KeyManagerService } from '../../src/modules/crypto/key-manager.service';
import { SdJwtService } from '../../src/modules/crypto/sd-jwt.service';

describe('Issuer Flow (Unit)', () => {
  let didKeyProvider: DidKeyProvider;
  let sdJwtService: SdJwtService;

  beforeEach(() => {
    didKeyProvider = new DidKeyProvider();
    const keyManager = new KeyManagerService();
    sdJwtService = new SdJwtService(keyManager);
  });

  it('should issue an education credential via SD-JWT-VC', async () => {
    const issuerKeyPair = await didKeyProvider.generateKeyPair();
    const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);

    const holderKeyPair = await didKeyProvider.generateKeyPair();
    const { did: holderDid } = await didKeyProvider.createDid(holderKeyPair);

    const sdJwtVc = await sdJwtService.issue({
      issuerDid,
      subjectDid: holderDid,
      credentialType: 'VerifiableEducationCredential',
      claims: {
        name: 'Sandhya Sharma',
        degree: 'MSc Computer Science',
        institution: 'National Technical University',
        graduationYear: 2023,
        gpa: 3.9,
      },
      disclosableClaims: ['name', 'degree', 'graduationYear', 'gpa'],
      holderPublicKey: holderKeyPair.publicKey,
      issuerPrivateKey: issuerKeyPair.privateKey,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    expect(sdJwtVc).toBeDefined();
    expect(sdJwtVc).toContain('~');

    const decoded = sdJwtService.decode(sdJwtVc);
    expect(decoded.payload.iss).toBe(issuerDid);
    expect(decoded.payload.sub).toBe(holderDid);
    expect(decoded.payload.vct).toBe('VerifiableEducationCredential');
    expect(decoded.disclosures.length).toBeGreaterThan(0);
  });

  it('should issue an income credential via SD-JWT-VC', async () => {
    const issuerKeyPair = await didKeyProvider.generateKeyPair();
    const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);

    const holderKeyPair = await didKeyProvider.generateKeyPair();
    const { did: holderDid } = await didKeyProvider.createDid(holderKeyPair);

    const sdJwtVc = await sdJwtService.issue({
      issuerDid,
      subjectDid: holderDid,
      credentialType: 'VerifiableIncomeCredential',
      claims: {
        name: 'Sandhya Sharma',
        annualIncome: 95000,
        employer: 'TechCorp India',
        currency: 'INR',
      },
      disclosableClaims: ['name', 'annualIncome', 'employer'],
      holderPublicKey: holderKeyPair.publicKey,
      issuerPrivateKey: issuerKeyPair.privateKey,
    });

    expect(sdJwtVc).toBeDefined();

    const result = await sdJwtService.verify(sdJwtVc, issuerKeyPair.publicKey);
    expect(result.valid).toBe(true);
    expect(result.payload.vct).toBe('VerifiableIncomeCredential');
  });

  it('should complete full issue-verify cycle under 5 seconds', async () => {
    const start = Date.now();

    const issuerKeyPair = await didKeyProvider.generateKeyPair();
    const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);

    const holderKeyPair = await didKeyProvider.generateKeyPair();
    const { did: holderDid } = await didKeyProvider.createDid(holderKeyPair);

    const sdJwtVc = await sdJwtService.issue({
      issuerDid,
      subjectDid: holderDid,
      credentialType: 'VerifiableEducationCredential',
      claims: { degree: 'MSc', institution: 'MIT' },
      disclosableClaims: ['degree'],
      holderPublicKey: holderKeyPair.publicKey,
      issuerPrivateKey: issuerKeyPair.privateKey,
    });

    const result = await sdJwtService.verify(sdJwtVc, issuerKeyPair.publicKey);

    expect(Date.now() - start).toBeLessThan(5000);
    expect(result.valid).toBe(true);
  });
});
