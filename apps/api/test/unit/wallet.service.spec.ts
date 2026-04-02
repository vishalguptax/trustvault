import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletService } from '../../src/modules/wallet/wallet.service';

describe('WalletService', () => {
  let service: WalletService;

  const mockPrisma = {
    walletDid: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    walletCredential: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    verificationRequest: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    credentialSchema: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    trustedIssuer: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  };

  const mockDidService = {
    createDid: vi.fn(),
  };

  const mockSdJwtService = {
    decode: vi.fn(),
    present: vi.fn(),
  };

  const mockOid4vciClient = {
    parseOfferUri: vi.fn(),
    exchangeCodeForToken: vi.fn(),
    createHolderProof: vi.fn(),
    requestCredential: vi.fn(),
  };

  const mockConsentService = {
    recordConsent: vi.fn(),
    getConsentHistory: vi.fn(),
  };

  const mockVerifierService = {
    handlePresentationResponse: vi.fn(),
  };

  const mockMailService = {
    sendCredentialIssued: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WalletService(
      mockPrisma as any,
      mockDidService as any,
      mockSdJwtService as any,
      mockOid4vciClient as any,
      mockConsentService as any,
      mockVerifierService as any,
      mockMailService as any,
    );
  });

  describe('createHolderDid', () => {
    it('should create a new DID and store it', async () => {
      const keyPair = { publicKey: { kty: 'EC' }, privateKey: { kty: 'EC' } };
      mockDidService.createDid.mockResolvedValue({ did: 'did:key:z123', keyPair });
      mockPrisma.walletDid.create.mockResolvedValue({
        did: 'did:key:z123',
        method: 'key',
        createdAt: new Date('2025-01-01'),
      });

      const result = await service.createHolderDid('holder-1', 'key');

      expect(mockDidService.createDid).toHaveBeenCalledWith('key');
      expect(result.did).toBe('did:key:z123');
      expect(result.method).toBe('key');
    });
  });

  describe('getOrCreateHolderDid', () => {
    it('should return existing DID if one exists', async () => {
      const walletDid = {
        did: 'did:key:existing',
        keyData: { publicKey: { kty: 'EC' }, privateKey: { kty: 'EC' } },
      };
      mockPrisma.walletDid.findFirst.mockResolvedValue(walletDid);

      const result = await service.getOrCreateHolderDid('holder-1');

      expect(result.did).toBe('did:key:existing');
      expect(mockDidService.createDid).not.toHaveBeenCalled();
    });

    it('should create a new DID if none exists', async () => {
      mockPrisma.walletDid.findFirst.mockResolvedValue(null);
      const keyPair = { publicKey: { kty: 'EC' }, privateKey: { kty: 'EC' } };
      mockDidService.createDid.mockResolvedValue({ did: 'did:key:new', keyPair });
      mockPrisma.walletDid.create.mockResolvedValue({
        did: 'did:key:new',
        keyData: keyPair,
      });

      const result = await service.getOrCreateHolderDid('holder-1');

      expect(mockDidService.createDid).toHaveBeenCalledWith('key');
      expect(result.did).toBe('did:key:new');
    });
  });

  describe('listCredentials', () => {
    it('should return enriched credentials and total count', async () => {
      const creds = [
        { id: 'c1', credentialType: 'UniversityDegree', issuerDid: 'did:key:issuer1' },
        { id: 'c2', credentialType: 'DriverLicense', issuerDid: 'did:key:issuer2' },
      ];
      mockPrisma.walletCredential.findMany.mockResolvedValue(creds);
      mockPrisma.credentialSchema.findMany.mockResolvedValue([
        { typeUri: 'UniversityDegree', name: 'University Degree' },
      ]);
      mockPrisma.trustedIssuer.findMany.mockResolvedValue([
        { did: 'did:key:issuer1', name: 'Test University' },
      ]);

      const result = await service.listCredentials('holder-1');

      expect(result.total).toBe(2);
      expect(result.credentials[0].typeName).toBe('University Degree');
      expect(result.credentials[0].issuerName).toBe('Test University');
      expect(result.credentials[1].typeName).toBe('DriverLicense'); // No schema match, falls back to type
      expect(result.credentials[1].issuerName).toBeNull(); // No issuer match
    });

    it('should return empty list when holder has no credentials', async () => {
      mockPrisma.walletCredential.findMany.mockResolvedValue([]);

      const result = await service.listCredentials('holder-1');

      expect(result.credentials).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getCredential', () => {
    it('should return credential when found', async () => {
      const cred = { id: 'c1', credentialType: 'UniversityDegree' };
      mockPrisma.walletCredential.findUnique.mockResolvedValue(cred);

      const result = await service.getCredential('c1');
      expect(result).toEqual(cred);
    });

    it('should throw NotFoundException when credential does not exist', async () => {
      mockPrisma.walletCredential.findUnique.mockResolvedValue(null);

      await expect(service.getCredential('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCredentialClaims', () => {
    it('should separate fixed and selective (selectable) claims', async () => {
      mockPrisma.walletCredential.findUnique.mockResolvedValue({
        id: 'c1',
        claims: {
          iss: 'did:key:issuer',
          sub: 'did:key:holder',
          iat: 1700000000,
          exp: 1800000000,
          vct: 'UniversityDegree',
          name: 'Alice',
          degree: 'CS',
          gpa: 3.8,
        },
        sdClaims: ['name', 'gpa'],
      });

      const result = await service.getCredentialClaims('c1');

      expect(result.fixedClaims).toEqual([{ key: 'degree', value: 'CS', selectable: false }]);
      expect(result.selectiveClaims).toEqual([
        { key: 'name', value: 'Alice', selectable: true },
        { key: 'gpa', value: 3.8, selectable: true },
      ]);
    });

    it('should exclude JWT reserved claims from output', async () => {
      mockPrisma.walletCredential.findUnique.mockResolvedValue({
        id: 'c1',
        claims: {
          iss: 'did:key:issuer',
          sub: 'did:key:holder',
          iat: 1700000000,
          vct: 'Test',
          cnf: { jwk: {} },
          status: {},
          _sd: [],
          customField: 'value',
        },
        sdClaims: [],
      });

      const result = await service.getCredentialClaims('c1');

      const allKeys = [...result.fixedClaims, ...result.selectiveClaims].map((c) => c.key);
      expect(allKeys).not.toContain('iss');
      expect(allKeys).not.toContain('sub');
      expect(allKeys).not.toContain('iat');
      expect(allKeys).not.toContain('vct');
      expect(allKeys).not.toContain('cnf');
      expect(allKeys).not.toContain('status');
      expect(allKeys).toContain('customField');
    });
  });

  describe('deleteCredential', () => {
    it('should delete a credential that exists', async () => {
      mockPrisma.walletCredential.findUnique.mockResolvedValue({ id: 'c1' });
      mockPrisma.walletCredential.delete.mockResolvedValue({ id: 'c1' });

      const result = await service.deleteCredential('c1');

      expect(result.deleted).toBe(true);
      expect(mockPrisma.walletCredential.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('should throw NotFoundException for non-existent credential', async () => {
      mockPrisma.walletCredential.findUnique.mockResolvedValue(null);

      await expect(service.deleteCredential('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('createPresentation', () => {
    it('should throw BadRequestException when consent is false', async () => {
      await expect(
        service.createPresentation('vr-1', 'holder-1', ['c1'], {}, false),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent verification request', async () => {
      mockPrisma.verificationRequest.findUnique.mockResolvedValue(null);

      await expect(
        service.createPresentation('nonexistent', 'holder-1', ['c1'], {}, true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a presentation and submit to verifier', async () => {
      const verificationRequest = {
        id: 'vr-1',
        nonce: 'nonce-123',
        state: 'state-abc',
        verifierDid: 'did:key:verifier',
      };
      const walletCred = {
        id: 'c1',
        rawCredential: 'header.payload~disclosure1~',
      };
      const holderDid = {
        did: 'did:key:holder',
        keyPair: { publicKey: { kty: 'EC' }, privateKey: { kty: 'EC' } },
      };

      mockPrisma.verificationRequest.findUnique.mockResolvedValue(verificationRequest);
      mockPrisma.walletDid.findFirst.mockResolvedValue({
        did: holderDid.did,
        keyData: holderDid.keyPair,
      });
      mockPrisma.walletCredential.findUnique.mockResolvedValue(walletCred);
      mockSdJwtService.present.mockResolvedValue('presented-sd-jwt');
      mockConsentService.recordConsent.mockResolvedValue(undefined);
      mockVerifierService.handlePresentationResponse.mockResolvedValue({
        verificationId: 'vr-1',
        status: 'verified',
        result: { verified: true, checks: {} },
      });

      const result = await service.createPresentation(
        'vr-1',
        'holder-1',
        ['c1'],
        { c1: ['name'] },
        true,
      );

      expect(result.presentationId).toBe('vr-1');
      expect(result.vpToken).toBe('presented-sd-jwt');
      expect(result.result).toBe('verified');
      expect(mockVerifierService.handlePresentationResponse).toHaveBeenCalledWith(
        'presented-sd-jwt',
        'state-abc',
      );
    });

    it('should JSON-stringify vpToken when multiple credentials are presented', async () => {
      const verificationRequest = {
        id: 'vr-1',
        nonce: 'nonce-123',
        state: 'state-abc',
        verifierDid: 'did:key:verifier',
      };

      mockPrisma.verificationRequest.findUnique.mockResolvedValue(verificationRequest);
      mockPrisma.walletDid.findFirst.mockResolvedValue({
        did: 'did:key:holder',
        keyData: { publicKey: {}, privateKey: {} },
      });
      mockPrisma.walletCredential.findUnique
        .mockResolvedValueOnce({ id: 'c1', rawCredential: 'cred1' })
        .mockResolvedValueOnce({ id: 'c2', rawCredential: 'cred2' });
      mockSdJwtService.present
        .mockResolvedValueOnce('presented-1')
        .mockResolvedValueOnce('presented-2');
      mockConsentService.recordConsent.mockResolvedValue(undefined);
      mockVerifierService.handlePresentationResponse.mockResolvedValue({
        verificationId: 'vr-1',
        status: 'verified',
        result: { verified: true, checks: {} },
      });

      const result = await service.createPresentation(
        'vr-1',
        'holder-1',
        ['c1', 'c2'],
        {},
        true,
      );

      expect(result.vpToken).toBe(JSON.stringify(['presented-1', 'presented-2']));
    });
  });

  describe('getConsentHistory', () => {
    it('should delegate to consentService', async () => {
      const history = [{ id: 'consent-1' }];
      mockConsentService.getConsentHistory.mockResolvedValue(history);

      const result = await service.getConsentHistory('holder-1');

      expect(mockConsentService.getConsentHistory).toHaveBeenCalledWith('holder-1');
      expect(result).toEqual(history);
    });
  });
});
