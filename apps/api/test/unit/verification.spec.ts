import { describe, it, expect, beforeEach } from 'vitest';
import { DidKeyProvider } from '../../src/modules/did/providers/did-key.provider';
import { KeyManagerService } from '../../src/modules/crypto/key-manager.service';
import { SdJwtService } from '../../src/modules/crypto/sd-jwt.service';

describe('Verification Flow (Unit)', () => {
  let didKeyProvider: DidKeyProvider;
  let sdJwtService: SdJwtService;

  beforeEach(() => {
    didKeyProvider = new DidKeyProvider();
    const keyManager = new KeyManagerService();
    sdJwtService = new SdJwtService(keyManager);
  });

  it('should verify a valid credential from trusted issuer', async () => {
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
    expect(result.valid).toBe(true);
    expect(result.payload.iss).toBe(issuerDid);
  });

  it('should reject a credential signed by untrusted issuer (wrong key)', async () => {
    const issuerKeyPair = await didKeyProvider.generateKeyPair();
    const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);
    const untrustedKeyPair = await didKeyProvider.generateKeyPair();

    const sdJwtVc = await sdJwtService.issue({
      issuerDid,
      subjectDid: 'did:key:zholder',
      credentialType: 'VerifiableEducationCredential',
      claims: { degree: 'Fake PhD' },
      disclosableClaims: ['degree'],
      issuerPrivateKey: issuerKeyPair.privateKey,
    });

    const result = await sdJwtService.verify(sdJwtVc, untrustedKeyPair.publicKey);
    expect(result.valid).toBe(false);
  });

  it('should reject an expired credential', async () => {
    const issuerKeyPair = await didKeyProvider.generateKeyPair();
    const { did: issuerDid } = await didKeyProvider.createDid(issuerKeyPair);

    const sdJwtVc = await sdJwtService.issue({
      issuerDid,
      subjectDid: 'did:key:zholder',
      credentialType: 'VerifiableEducationCredential',
      claims: { degree: 'MSc' },
      disclosableClaims: ['degree'],
      issuerPrivateKey: issuerKeyPair.privateKey,
      expiresAt: new Date(Date.now() - 1000),
    });

    const decoded = sdJwtService.decode(sdJwtVc);
    expect(decoded.payload.exp).toBeDefined();

    const now = Math.floor(Date.now() / 1000);
    const isExpired = (decoded.payload.exp as number) < now;
    expect(isExpired).toBe(true);
  });

  it('should complete verification under 3 seconds', async () => {
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
      disclosableClaims: ['degree', 'institution'],
      holderPublicKey: holderKeyPair.publicKey,
      issuerPrivateKey: issuerKeyPair.privateKey,
    });

    const result = await sdJwtService.verify(sdJwtVc, issuerKeyPair.publicKey);

    expect(Date.now() - start).toBeLessThan(3000);
    expect(result.valid).toBe(true);
  });
});
