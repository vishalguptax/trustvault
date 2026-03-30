import { describe, it, expect, beforeEach } from 'vitest';
import { DidKeyProvider } from '../../src/modules/did/providers/did-key.provider';
import { KeyManagerService } from '../../src/modules/crypto/key-manager.service';
import { SdJwtService } from '../../src/modules/crypto/sd-jwt.service';

describe('Trust Enforcement (Unit)', () => {
  let didKeyProvider: DidKeyProvider;
  let sdJwtService: SdJwtService;

  beforeEach(() => {
    didKeyProvider = new DidKeyProvider();
    const keyManager = new KeyManagerService();
    sdJwtService = new SdJwtService(keyManager);
  });

  it('should verify credential from a known issuer key', async () => {
    const trustedIssuerKeyPair = await didKeyProvider.generateKeyPair();
    const { did: trustedIssuerDid } = await didKeyProvider.createDid(trustedIssuerKeyPair);

    const sdJwtVc = await sdJwtService.issue({
      issuerDid: trustedIssuerDid,
      subjectDid: 'did:key:zholder',
      credentialType: 'VerifiableEducationCredential',
      claims: { degree: 'MSc', institution: 'National Technical University' },
      disclosableClaims: ['degree', 'institution'],
      issuerPrivateKey: trustedIssuerKeyPair.privateKey,
    });

    const result = await sdJwtService.verify(sdJwtVc, trustedIssuerKeyPair.publicKey);
    expect(result.valid).toBe(true);
  });

  it('should reject credential from an untrusted issuer (QuickDegree Online scenario)', async () => {
    const untrustedIssuerKeyPair = await didKeyProvider.generateKeyPair();
    const { did: untrustedDid } = await didKeyProvider.createDid(untrustedIssuerKeyPair);

    const sdJwtVc = await sdJwtService.issue({
      issuerDid: untrustedDid,
      subjectDid: 'did:key:zholder',
      credentialType: 'VerifiableEducationCredential',
      claims: { degree: 'PhD', institution: 'QuickDegree Online' },
      disclosableClaims: ['degree', 'institution'],
      issuerPrivateKey: untrustedIssuerKeyPair.privateKey,
    });

    const differentKey = await didKeyProvider.generateKeyPair();
    const result = await sdJwtService.verify(sdJwtVc, differentKey.publicKey);
    expect(result.valid).toBe(false);
  });
});
