import { describe, it, expect, beforeEach } from 'vitest';
import { DidKeyProvider } from '../../src/modules/did/providers/did-key.provider';
import { KeyManagerService } from '../../src/modules/crypto/key-manager.service';
import { SdJwtService } from '../../src/modules/crypto/sd-jwt.service';

describe('Loan Processing E2E (Unit)', () => {
  let didKeyProvider: DidKeyProvider;
  let sdJwtService: SdJwtService;

  beforeEach(() => {
    didKeyProvider = new DidKeyProvider();
    const keyManager = new KeyManagerService();
    sdJwtService = new SdJwtService(keyManager);
  });

  it('should complete full loan verification flow under 2 minutes', async () => {
    const start = Date.now();

    // Setup actors
    const bankKeyPair = await didKeyProvider.generateKeyPair();
    const { did: bankDid } = await didKeyProvider.createDid(bankKeyPair);

    const universityKeyPair = await didKeyProvider.generateKeyPair();
    const { did: universityDid } = await didKeyProvider.createDid(universityKeyPair);

    const holderKeyPair = await didKeyProvider.generateKeyPair();
    const { did: holderDid } = await didKeyProvider.createDid(holderKeyPair);

    // 1. Bank issues income credential
    const incomeSdJwt = await sdJwtService.issue({
      issuerDid: bankDid,
      subjectDid: holderDid,
      credentialType: 'VerifiableIncomeCredential',
      claims: {
        name: 'Sandhya Sharma',
        annualIncome: 95000,
        employer: 'TechCorp India',
        currency: 'INR',
        employmentType: 'Full-time',
      },
      disclosableClaims: ['name', 'annualIncome', 'employer', 'employmentType'],
      holderPublicKey: holderKeyPair.publicKey,
      issuerPrivateKey: bankKeyPair.privateKey,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    // 2. University issues education credential
    const educationSdJwt = await sdJwtService.issue({
      issuerDid: universityDid,
      subjectDid: holderDid,
      credentialType: 'VerifiableEducationCredential',
      claims: {
        name: 'Sandhya Sharma',
        degree: 'MSc Computer Science',
        institution: 'National Technical University',
        graduationYear: 2023,
        gpa: 3.9,
      },
      disclosableClaims: ['name', 'degree', 'institution', 'graduationYear', 'gpa'],
      holderPublicKey: holderKeyPair.publicKey,
      issuerPrivateKey: universityKeyPair.privateKey,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    // 3. Verify both credentials
    const incomeResult = await sdJwtService.verify(incomeSdJwt, bankKeyPair.publicKey);
    expect(incomeResult.valid).toBe(true);
    expect(incomeResult.payload.vct).toBe('VerifiableIncomeCredential');

    const educationResult = await sdJwtService.verify(educationSdJwt, universityKeyPair.publicKey);
    expect(educationResult.valid).toBe(true);
    expect(educationResult.payload.vct).toBe('VerifiableEducationCredential');

    // 4. Verify both credentials have correct issuers
    const incomeDecoded = sdJwtService.decode(incomeSdJwt);
    expect(incomeDecoded.payload.iss).toBe(bankDid);

    const eduDecoded = sdJwtService.decode(educationSdJwt);
    expect(eduDecoded.payload.iss).toBe(universityDid);

    // 5. Check timing
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(120000);

    // 6. Verify selective disclosure works
    expect(incomeDecoded.disclosures.length).toBeGreaterThan(0);
    expect(eduDecoded.disclosures.length).toBeGreaterThan(0);
  });

  it('should handle multi-credential presentation', async () => {
    const bankKeyPair = await didKeyProvider.generateKeyPair();
    const { did: bankDid } = await didKeyProvider.createDid(bankKeyPair);

    const universityKeyPair = await didKeyProvider.generateKeyPair();
    const { did: universityDid } = await didKeyProvider.createDid(universityKeyPair);

    const holderKeyPair = await didKeyProvider.generateKeyPair();
    const { did: holderDid } = await didKeyProvider.createDid(holderKeyPair);

    const incomeSdJwt = await sdJwtService.issue({
      issuerDid: bankDid,
      subjectDid: holderDid,
      credentialType: 'VerifiableIncomeCredential',
      claims: { annualIncome: 95000, currency: 'INR' },
      disclosableClaims: ['annualIncome'],
      holderPublicKey: holderKeyPair.publicKey,
      issuerPrivateKey: bankKeyPair.privateKey,
    });

    const eduSdJwt = await sdJwtService.issue({
      issuerDid: universityDid,
      subjectDid: holderDid,
      credentialType: 'VerifiableEducationCredential',
      claims: { degree: 'MSc', institution: 'MIT' },
      disclosableClaims: ['degree', 'institution'],
      holderPublicKey: holderKeyPair.publicKey,
      issuerPrivateKey: universityKeyPair.privateKey,
    });

    // Both should verify independently
    const r1 = await sdJwtService.verify(incomeSdJwt, bankKeyPair.publicKey);
    const r2 = await sdJwtService.verify(eduSdJwt, universityKeyPair.publicKey);

    expect(r1.valid).toBe(true);
    expect(r2.valid).toBe(true);
  });
});
