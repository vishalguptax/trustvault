import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'crypto';
import type { JWK } from 'jose';
import * as jose from 'jose';
import { DatabaseService } from '../../database/database.service';
import { DidService } from '../did/did.service';
import { SdJwtService } from '../crypto/sd-jwt.service';
import { SIGNING_ALGORITHM } from '../../common/constants';

interface ClaimDefinitionDto {
  key: string;
  label: string;
  type: string;
  required: boolean;
  selectivelyDisclosable: boolean;
}

export interface SchemaDto {
  id: string;
  type: string;
  name: string;
  description: string;
  claims: ClaimDefinitionDto[];
}

interface CredentialSchemaLean {
  _id: unknown;
  typeUri: string;
  name: string;
  description: string | null;
  schema: Record<string, unknown>;
  sdClaims: string[];
}

@Injectable()
export class IssuerService {
  constructor(
    private readonly db: DatabaseService,
    private readonly didService: DidService,
    private readonly sdJwtService: SdJwtService,
    private readonly configService: ConfigService,
  ) {}

  async getOrCreateIssuerDid(): Promise<string> {
    const configured = this.configService.get<string>('issuer.did');
    if (configured) {
      return configured;
    }
    const existing = await this.db.did.findOne({ method: 'key', active: true }).sort({ createdAt: 1 }).lean();
    if (existing) {
      return existing.did;
    }
    const result = await this.didService.createDid('key');
    return result.did;
  }

  async getIssuerMetadata(): Promise<Record<string, unknown>> {
    const issuerDid = await this.getOrCreateIssuerDid();
    const baseUrl = this.configService.get<string>('issuer.baseUrl');

    const schemas = await this.db.credentialSchema.find({ active: true }).lean();

    const credentialConfigurations: Record<string, unknown> = {};
    for (const schema of schemas) {
      credentialConfigurations[schema.typeUri] = {
        format: 'vc+sd-jwt',
        scope: schema.typeUri,
        cryptographic_binding_methods_supported: ['did:key'],
        credential_signing_alg_values_supported: [SIGNING_ALGORITHM],
        credential_definition: {
          type: [schema.typeUri],
        },
        display: [
          {
            name: schema.name,
            locale: 'en-US',
          },
        ],
      };
    }

    return {
      credential_issuer: baseUrl,
      credential_endpoint: `${baseUrl}/credential`,
      token_endpoint: `${baseUrl}/token`,
      credential_configurations_supported: credentialConfigurations,
      display: [
        {
          name: 'TrustiLock Issuer',
          locale: 'en-US',
        },
      ],
      issuer_did: issuerDid,
    };
  }

  /**
   * Verify that the calling user is authorized to issue the given credential type.
   * Admins bypass this check. Issuers must be linked to a trusted issuer entry
   * that includes the requested credential type.
   */
  async verifyIssuerAuthorization(
    userId: string,
    schemaTypeUri: string,
  ): Promise<void> {
    const user = await this.db.user.findById(userId).lean();
    if (!user) {
      throw new ForbiddenException('User not found');
    }
    if (user.role === 'admin') {
      return; // Admins can issue any credential type
    }
    if (!user.trustedIssuerId) {
      throw new ForbiddenException('You are not linked to a trusted issuer. Contact an administrator.');
    }
    const issuer = await this.db.trustedIssuer.findById(user.trustedIssuerId).lean();
    if (!issuer || issuer.status !== 'active') {
      throw new ForbiddenException('Your issuer account is not active in the trust registry.');
    }
    if (!issuer.credentialTypes.includes(schemaTypeUri)) {
      throw new ForbiddenException(
        `You are not authorized to issue ${schemaTypeUri}. Authorized types: ${issuer.credentialTypes.join(', ')}`,
      );
    }
  }

  async createOffer(
    schemaTypeUri: string,
    subjectDid: string,
    claims: Record<string, unknown>,
    pinRequired: boolean = false,
    userId?: string,
  ): Promise<{
    offerId: string;
    credentialOfferUri: string;
    preAuthorizedCode: string;
  }> {
    if (userId) {
      await this.verifyIssuerAuthorization(userId, schemaTypeUri);
    }

    const schema = await this.db.credentialSchema.findOne({ typeUri: schemaTypeUri }).lean();
    if (!schema) {
      throw new NotFoundException(`Credential schema not found: ${schemaTypeUri}`);
    }

    const issuerDid = await this.getOrCreateIssuerDid();
    const preAuthorizedCode = randomBytes(32).toString('base64url');
    const baseUrl = this.configService.get<string>('issuer.baseUrl');

    const offer = await this.db.credentialOffer.create({
      issuerDid,
      schemaTypeUri,
      preAuthorizedCode,
      pinRequired,
      claims: JSON.parse(JSON.stringify(claims)),
      status: 'pending',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    const credentialOfferPayload = {
      credential_issuer: baseUrl,
      credential_configuration_ids: [schemaTypeUri],
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': preAuthorizedCode,
          user_pin_required: pinRequired,
        },
      },
      subject_did: subjectDid,
    };

    const credentialOfferUri = `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(credentialOfferPayload))}`;

    return {
      offerId: offer._id.toString(),
      credentialOfferUri,
      preAuthorizedCode,
    };
  }

  async createBulkOffers(
    schemaTypeUri: string,
    offers: Array<{ claims: Record<string, unknown> }>,
    userId?: string,
  ) {
    const results: Array<{
      index: number;
      offerId?: string;
      credentialOfferUri?: string;
      error?: string;
    }> = [];

    let successful = 0;
    let failed = 0;

    // Verify authorization once for the entire batch
    if (userId) {
      await this.verifyIssuerAuthorization(userId, schemaTypeUri);
    }

    for (let i = 0; i < offers.length; i++) {
      try {
        const result = await this.createOffer(
          schemaTypeUri,
          'pending', // subjectDid — resolved during OID4VCI flow
          offers[i].claims,
          false, // pinRequired
          // Skip per-offer auth check since we already verified above
        );
        results.push({
          index: i,
          offerId: result.offerId,
          credentialOfferUri: result.credentialOfferUri,
        });
        successful++;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ index: i, error: message });
        failed++;
      }
    }

    return {
      total: offers.length,
      successful,
      failed,
      results,
    };
  }

  async exchangeToken(
    preAuthorizedCode: string,
    pin?: string,
  ): Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    c_nonce: string;
    c_nonce_expires_in: number;
  }> {
    const offer = await this.db.credentialOffer.findOne({ preAuthorizedCode }).lean();

    if (!offer) {
      throw new BadRequestException('Invalid pre-authorized code');
    }

    if (offer.status !== 'pending') {
      throw new BadRequestException(`Offer already used or expired. Status: ${offer.status}`);
    }

    if (new Date() > offer.expiresAt) {
      await this.db.credentialOffer.findByIdAndUpdate(offer._id, { $set: { status: 'expired' } }, { new: true }).lean();
      throw new BadRequestException('Offer has expired');
    }

    if (offer.pinRequired && !pin) {
      throw new BadRequestException('PIN is required');
    }

    const accessToken = randomBytes(32).toString('base64url');
    const cNonce = randomBytes(16).toString('base64url');

    await this.db.credentialOffer.findByIdAndUpdate(offer._id, {
      $set: {
        accessToken,
        cNonce,
        status: 'token_issued',
      },
    }, { new: true }).lean();

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 300,
      c_nonce: cNonce,
      c_nonce_expires_in: 300,
    };
  }

  async issueCredential(
    accessToken: string,
    format: string,
    credentialDefinition: { type: string[] },
    proof?: { proof_type: string; jwt: string },
  ): Promise<{
    credential: string;
    c_nonce: string;
    c_nonce_expires_in: number;
  }> {
    const offer = await this.db.credentialOffer.findOne({ accessToken }).lean();

    if (!offer) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (offer.status !== 'token_issued') {
      throw new BadRequestException(`Invalid offer status: ${offer.status}`);
    }

    const schema = await this.db.credentialSchema.findOne({ typeUri: offer.schemaTypeUri }).lean();
    if (!schema) {
      throw new NotFoundException(`Schema not found: ${offer.schemaTypeUri}`);
    }

    let holderPublicKey: JWK | undefined;
    let holderDid: string | undefined;
    if (proof?.jwt) {
      try {
        const decoded = jose.decodeJwt(proof.jwt);
        const header = jose.decodeProtectedHeader(proof.jwt);

        if (header.jwk) {
          holderPublicKey = header.jwk as JWK;
        }
        if (decoded.iss) {
          holderDid = decoded.iss as string;
        }
      } catch {
        throw new BadRequestException('Invalid proof JWT');
      }
    }

    const issuerKeyPair = await this.didService.getKeyPair(offer.issuerDid);
    const claims = offer.claims as Record<string, unknown>;
    const subjectDid = holderDid || (claims.subjectDid as string) || 'unknown';

    const expiryDays = this.configService.get<number>('credential.defaultExpiryDays') || 365;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const sdJwtVc = await this.sdJwtService.issue({
      issuerDid: offer.issuerDid,
      subjectDid,
      credentialType: offer.schemaTypeUri,
      claims,
      disclosableClaims: schema.sdClaims,
      holderPublicKey,
      issuerPrivateKey: issuerKeyPair.privateKey,
      expiresAt,
    });

    const credentialHash = createHash('sha256').update(sdJwtVc).digest('hex');
    const newCNonce = randomBytes(16).toString('base64url');

    await this.db.issuedCredential.create({
      issuerDid: offer.issuerDid,
      subjectDid,
      schemaTypeUri: offer.schemaTypeUri,
      credentialHash,
      status: 'active',
      expiresAt,
    });

    await this.db.credentialOffer.findByIdAndUpdate(offer._id, {
      $set: { status: 'credential_issued', cNonce: newCNonce },
    }, { new: true }).lean();

    return {
      credential: sdJwtVc,
      c_nonce: newCNonce,
      c_nonce_expires_in: 300,
    };
  }

  toSchemaDto(schema: CredentialSchemaLean): SchemaDto {
    const schemaJson = schema.schema as Record<
      string,
      { type?: string; label?: string; required?: boolean }
    >;
    const claims: ClaimDefinitionDto[] = Object.entries(schemaJson).map(
      ([key, def]) => ({
        key,
        label: def.label || key,
        type: def.type || 'string',
        required: def.required ?? true,
        selectivelyDisclosable: schema.sdClaims.includes(key),
      }),
    );
    return {
      id: (schema._id as { toString(): string }).toString(),
      type: schema.typeUri,
      name: schema.name,
      description: schema.description || '',
      claims,
    };
  }

  async listSchemas(): Promise<SchemaDto[]> {
    const schemas = await this.db.credentialSchema.find({ active: true }).lean();
    return schemas.map((s) => this.toSchemaDto(s));
  }

  async getSchema(id: string): Promise<SchemaDto> {
    const schema = await this.db.credentialSchema.findById(id).lean();
    if (!schema) {
      throw new NotFoundException(`Schema not found: ${id}`);
    }
    return this.toSchemaDto(schema);
  }

  async getOfferPreview(preAuthorizedCode: string) {
    const offer = await this.db.credentialOffer.findOne({ preAuthorizedCode }).lean();
    if (!offer) {
      throw new NotFoundException('Credential offer not found');
    }

    const schema = await this.db.credentialSchema.findOne({ typeUri: offer.schemaTypeUri }).lean();

    const trustedIssuer = await this.db.trustedIssuer.findOne({ did: offer.issuerDid }).lean();

    const claims = offer.claims as Record<string, unknown>;
    const claimKeys = Object.keys(claims).filter(
      (k) => !['subjectDid', 'documentName'].includes(k),
    );

    return {
      issuerName: trustedIssuer?.name ?? null,
      issuerDid: offer.issuerDid,
      credentialType: offer.schemaTypeUri,
      credentialTypeName: schema?.name ?? offer.schemaTypeUri,
      documentName: (claims.documentName as string) ?? null,
      claims: claimKeys,
      claimValues: claims,
      status: offer.status,
      expiresAt: offer.expiresAt,
    };
  }

  async listOffers() {
    const offers = await this.db.credentialOffer.find({}).sort({ createdAt: -1 }).lean();

    const baseUrl = this.configService.get<string>('issuer.baseUrl');

    return offers.map((offer) => {
      const claims = offer.claims as Record<string, unknown>;
      const isExpired = offer.status === 'pending' && new Date() > offer.expiresAt;

      const credentialOfferPayload = {
        credential_issuer: baseUrl,
        credential_configuration_ids: [offer.schemaTypeUri],
        grants: {
          'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
            'pre-authorized_code': offer.preAuthorizedCode,
            user_pin_required: offer.pinRequired,
          },
        },
        subject_did: 'pending',
      };
      const credentialOfferUri = `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(credentialOfferPayload))}`;

      return {
        id: offer._id.toString(),
        schemaTypeUri: offer.schemaTypeUri,
        status: isExpired ? 'expired' : offer.status,
        claims,
        credentialOfferUri: (offer.status === 'pending' && !isExpired) ? credentialOfferUri : null,
        preAuthorizedCode: offer.preAuthorizedCode,
        createdAt: offer.createdAt,
        expiresAt: offer.expiresAt,
      };
    });
  }

  async listIssuedCredentials(issuerDid?: string) {
    const where = issuerDid ? { issuerDid } : {};
    const credentials = await this.db.issuedCredential.find(where).sort({ issuedAt: -1 }).lean();
    return credentials.map((c) => ({
      id: c._id.toString(),
      type: c.schemaTypeUri,
      subjectDid: c.subjectDid,
      issuerDid: c.issuerDid,
      status: c.status,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
    }));
  }
}
