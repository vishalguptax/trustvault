import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WalletService } from '../../src/modules/wallet/wallet.service';

/** Returns a vi.fn() whose return value has chainable .lean(), .sort(), .select(), .exec(). */
function mockQuery(resolvedValue: unknown) {
  const chain = {
    lean: vi.fn().mockResolvedValue(resolvedValue),
    sort: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    exec: vi.fn().mockResolvedValue(resolvedValue),
  };
  return vi.fn().mockReturnValue(chain);
}

/** Returns a vi.fn() that resolves to a Mongoose document with .toObject(). */
function mockCreate(resolvedValue: unknown) {
  return vi.fn().mockResolvedValue({
    ...(resolvedValue as Record<string, unknown>),
    toObject: () => resolvedValue,
  });
}

/** Returns a vi.fn() that resolves to { modifiedCount: 1 }. */
function mockUpdate() {
  return vi.fn().mockResolvedValue({ modifiedCount: 1 });
}

describe('WalletService', () => {
  let service: WalletService;

  const mockDb = {
    walletDid: {
      findOne: mockQuery(null),
      create: mockCreate(null),
    },
    walletCredential: {
      find: mockQuery([]),
      findById: mockQuery(null),
      create: mockCreate(null),
      deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
    },
    verificationRequest: {
      findById: mockQuery(null),
      updateOne: mockUpdate(),
    },
    credentialSchema: {
      find: mockQuery([]),
      findOne: mockQuery(null),
    },
    trustedIssuer: {
      find: mockQuery([]),
      findOne: mockQuery(null),
    },
    user: {
      findById: mockQuery(null),
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

    // Reset mock implementations to defaults
    mockDb.walletDid.findOne = mockQuery(null);
    mockDb.walletDid.create = mockCreate(null);
    mockDb.walletCredential.find = mockQuery([]);
    mockDb.walletCredential.findById = mockQuery(null);
    mockDb.walletCredential.create = mockCreate(null);
    mockDb.walletCredential.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });
    mockDb.verificationRequest.findById = mockQuery(null);
    mockDb.verificationRequest.updateOne = mockUpdate();
    mockDb.credentialSchema.find = mockQuery([]);
    mockDb.credentialSchema.findOne = mockQuery(null);
    mockDb.trustedIssuer.find = mockQuery([]);
    mockDb.trustedIssuer.findOne = mockQuery(null);
    mockDb.user.findById = mockQuery(null);

    service = new WalletService(
      mockDb as any,
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
      mockDb.walletDid.create = mockCreate({
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
      mockDb.walletDid.findOne = mockQuery(walletDid);

      const result = await service.getOrCreateHolderDid('holder-1');

      expect(result.did).toBe('did:key:existing');
      expect(mockDidService.createDid).not.toHaveBeenCalled();
    });

    it('should create a new DID if none exists', async () => {
      mockDb.walletDid.findOne = mockQuery(null);
      const keyPair = { publicKey: { kty: 'EC' }, privateKey: { kty: 'EC' } };
      mockDidService.createDid.mockResolvedValue({ did: 'did:key:new', keyPair });
      mockDb.walletDid.create = mockCreate({
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
        { _id: 'c1', credentialType: 'UniversityDegree', issuerDid: 'did:key:issuer1', claims: { iss: 'did:key:issuer1' }, sdClaims: [] },
        { _id: 'c2', credentialType: 'DriverLicense', issuerDid: 'did:key:issuer2', claims: { iss: 'did:key:issuer2' }, sdClaims: [] },
      ];
      mockDb.walletCredential.find = mockQuery(creds);
      mockDb.credentialSchema.find = mockQuery([
        { typeUri: 'UniversityDegree', name: 'University Degree', active: true },
      ]);
      mockDb.trustedIssuer.find = mockQuery([
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
      mockDb.walletCredential.find = mockQuery([]);

      const result = await service.listCredentials('holder-1');

      expect(result.credentials).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('getCredential', () => {
    it('should return credential when found', async () => {
      const cred = { _id: 'c1', credentialType: 'UniversityDegree' };
      mockDb.walletCredential.findById = mockQuery(cred);

      const result = await service.getCredential('c1');
      expect(result.id).toBe('c1');
      expect(result.credentialType).toBe('UniversityDegree');
    });

    it('should throw NotFoundException when credential does not exist', async () => {
      mockDb.walletCredential.findById = mockQuery(null);

      await expect(service.getCredential('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getCredentialClaims', () => {
    it('should separate fixed and selective (selectable) claims', async () => {
      mockDb.walletCredential.findById = mockQuery({
        _id: 'c1',
        rawCredential: 'header.payload~disclosure1~',
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
      mockSdJwtService.decode.mockReturnValue({
        payload: {
          iss: 'did:key:issuer',
          sub: 'did:key:holder',
          iat: 1700000000,
          exp: 1800000000,
          vct: 'UniversityDegree',
          degree: 'CS',
        },
        disclosures: [
          Buffer.from(JSON.stringify(['salt1', 'name', 'Alice'])).toString('base64url'),
          Buffer.from(JSON.stringify(['salt2', 'gpa', 3.8])).toString('base64url'),
        ],
      });

      const result = await service.getCredentialClaims('c1');

      expect(result.fixedClaims).toEqual([{ key: 'degree', value: 'CS', selectable: false }]);
      expect(result.selectiveClaims).toEqual([
        { key: 'name', value: 'Alice', selectable: true },
        { key: 'gpa', value: 3.8, selectable: true },
      ]);
    });

    it('should exclude JWT reserved claims from output', async () => {
      mockDb.walletCredential.findById = mockQuery({
        _id: 'c1',
        rawCredential: 'header.payload~',
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
      mockSdJwtService.decode.mockReturnValue({
        payload: {
          iss: 'did:key:issuer',
          sub: 'did:key:holder',
          iat: 1700000000,
          vct: 'Test',
          cnf: { jwk: {} },
          status: {},
          _sd: [],
          customField: 'value',
        },
        disclosures: [],
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
      mockDb.walletCredential.findById = mockQuery({ _id: 'c1' });
      mockDb.walletCredential.deleteOne = vi.fn().mockResolvedValue({ deletedCount: 1 });

      const result = await service.deleteCredential('c1');

      expect(result.deleted).toBe(true);
      expect(mockDb.walletCredential.deleteOne).toHaveBeenCalledWith({ _id: 'c1' });
    });

    it('should throw NotFoundException for non-existent credential', async () => {
      mockDb.walletCredential.findById = mockQuery(null);

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
      mockDb.verificationRequest.findById = mockQuery(null);

      await expect(
        service.createPresentation('nonexistent', 'holder-1', ['c1'], {}, true),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a presentation and submit to verifier', async () => {
      const verificationRequest = {
        _id: 'vr-1',
        nonce: 'nonce-123',
        state: 'state-abc',
        verifierDid: 'did:key:verifier',
      };
      const walletCred = {
        _id: 'c1',
        rawCredential: 'header.payload~disclosure1~',
      };
      const holderDid = {
        did: 'did:key:holder',
        keyData: { publicKey: { kty: 'EC' }, privateKey: { kty: 'EC' } },
      };

      mockDb.verificationRequest.findById = mockQuery(verificationRequest);
      mockDb.walletDid.findOne = mockQuery({
        did: holderDid.did,
        keyData: holderDid.keyData,
      });
      mockDb.walletCredential.findById = mockQuery(walletCred);
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
        _id: 'vr-1',
        nonce: 'nonce-123',
        state: 'state-abc',
        verifierDid: 'did:key:verifier',
      };

      mockDb.verificationRequest.findById = mockQuery(verificationRequest);
      mockDb.walletDid.findOne = mockQuery({
        did: 'did:key:holder',
        keyData: { publicKey: {}, privateKey: {} },
      });

      // For multiple credentials, we need findById to return different values on successive calls.
      // Since mockQuery creates a new fn each time, we set it once to return c1,
      // but the service calls getCredential for each. We need sequential resolution.
      const findByIdChain1 = {
        lean: vi.fn().mockResolvedValueOnce({ _id: 'c1', rawCredential: 'cred1', sdClaims: [] }),
        sort: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn(),
      };
      const findByIdChain2 = {
        lean: vi.fn().mockResolvedValueOnce({ _id: 'c2', rawCredential: 'cred2', sdClaims: [] }),
        sort: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        exec: vi.fn(),
      };
      mockDb.walletCredential.findById = vi.fn()
        .mockReturnValueOnce(findByIdChain1)
        .mockReturnValueOnce(findByIdChain2);

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
