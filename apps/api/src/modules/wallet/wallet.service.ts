import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import type { JWK } from 'jose';
import { PrismaService } from '../../prisma/prisma.service';
import { DidService } from '../did/did.service';
import { SdJwtService } from '../crypto/sd-jwt.service';
import { Oid4vciClientService } from './oid4vci-client.service';
import { ConsentService } from './consent.service';
import { VerifierService } from '../verifier/verifier.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly didService: DidService,
    private readonly sdJwtService: SdJwtService,
    private readonly oid4vciClient: Oid4vciClientService,
    private readonly consentService: ConsentService,
    @Inject(forwardRef(() => VerifierService))
    private readonly verifierService: VerifierService,
    private readonly mailService: MailService,
  ) {}

  async createHolderDid(holderId: string, method: string = 'key') {
    const result = await this.didService.createDid(method);

    const walletDid = await this.prisma.walletDid.create({
      data: {
        holderId,
        did: result.did,
        method,
        keyData: JSON.parse(JSON.stringify(result.keyPair)),
        isPrimary: true,
      },
    });

    return { did: walletDid.did, method: walletDid.method, createdAt: walletDid.createdAt };
  }

  async getOrCreateHolderDid(holderId: string): Promise<{ did: string; keyPair: { publicKey: JWK; privateKey: JWK } }> {
    let walletDid = await this.prisma.walletDid.findFirst({
      where: { holderId, isPrimary: true },
    });

    if (!walletDid) {
      const result = await this.didService.createDid('key');
      walletDid = await this.prisma.walletDid.create({
        data: {
          holderId,
          did: result.did,
          method: 'key',
          keyData: JSON.parse(JSON.stringify(result.keyPair)),
          isPrimary: true,
        },
      });
    }

    const keyData = walletDid.keyData as unknown as { publicKey: JWK; privateKey: JWK };
    return { did: walletDid.did, keyPair: keyData };
  }

  async receiveCredential(
    credentialOfferUri: string,
    holderId: string,
  ) {
    const offer = this.oid4vciClient.parseOfferUri(credentialOfferUri);
    const preAuthCode = offer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code']['pre-authorized_code'];
    const credentialType = offer.credential_configuration_ids[0];

    const tokenEndpoint = `${offer.credential_issuer}/token`;
    const tokenResponse = await this.oid4vciClient.exchangeCodeForToken(tokenEndpoint, preAuthCode);

    const holder = await this.getOrCreateHolderDid(holderId);

    const proofJwt = await this.oid4vciClient.createHolderProof(
      holder.did,
      holder.keyPair.privateKey,
      tokenResponse.c_nonce,
      offer.credential_issuer,
    );

    const credentialEndpoint = `${offer.credential_issuer}/credential`;
    const credentialResponse = await this.oid4vciClient.requestCredential(
      credentialEndpoint,
      tokenResponse.access_token,
      'vc+sd-jwt',
      credentialType,
      proofJwt,
    );

    const decoded = this.sdJwtService.decode(credentialResponse.credential);
    const payload = decoded.payload as Record<string, unknown>;

    // Decode disclosures to extract actual selective disclosure claim values
    const sdClaimNames: string[] = [];
    const disclosedValues: Record<string, unknown> = {};
    for (const d of decoded.disclosures) {
      try {
        const parsed = JSON.parse(Buffer.from(d, 'base64url').toString());
        const claimName = parsed[1] as string;
        const claimValue = parsed[2];
        sdClaimNames.push(claimName);
        if (claimValue !== undefined) {
          disclosedValues[claimName] = claimValue;
        }
      } catch {
        sdClaimNames.push(d);
      }
    }

    // Merge payload with decoded disclosure values so all claims are stored
    const claims = { ...payload, ...disclosedValues };

    const issuedAt = payload.iat ? new Date((payload.iat as number) * 1000) : new Date();
    const expiresAt = payload.exp ? new Date((payload.exp as number) * 1000) : undefined;

    const walletCred = await this.prisma.walletCredential.create({
      data: {
        holderId,
        rawCredential: credentialResponse.credential,
        format: 'sd-jwt-vc',
        credentialType,
        issuerDid: payload.iss as string,
        claims: JSON.parse(JSON.stringify(claims)),
        sdClaims: sdClaimNames,
        issuedAt,
        expiresAt,
      },
    });

    const schema = await this.prisma.credentialSchema.findUnique({
      where: { typeUri: credentialType },
    });
    const trustedIssuer = await this.prisma.trustedIssuer.findFirst({
      where: { did: payload.iss as string },
    });

    const typeName = schema?.name || credentialType;
    const issuerName = trustedIssuer?.name || (payload.iss as string);

    const holderUser = await this.prisma.user.findUnique({ where: { id: holderId } });
    if (holderUser) {
      this.mailService
        .sendCredentialIssued(holderUser.email, holderUser.name, typeName, issuerName)
        .catch(() => {});
    }

    return {
      credentialId: walletCred.id,
      type: credentialType,
      typeName,
      issuerDid: payload.iss as string,
      issuerName: trustedIssuer?.name || null,
      subjectDid: (payload.sub as string) || null,
      claims,
      sdClaims: walletCred.sdClaims,
      rawCredential: walletCred.rawCredential,
      status: 'active',
      issuedAt,
      expiresAt: expiresAt || null,
    };
  }

  async listCredentials(holderId: string) {
    const credentials = await this.prisma.walletCredential.findMany({
      where: { holderId },
      orderBy: { createdAt: 'desc' },
    });

    const schemas = await this.prisma.credentialSchema.findMany({ where: { active: true } });
    const schemaMap = new Map(schemas.map((s) => [s.typeUri, s.name]));

    const issuerDids = [...new Set(credentials.map((c) => c.issuerDid))];
    const trustedIssuers = await this.prisma.trustedIssuer.findMany({
      where: { did: { in: issuerDids } },
    });
    const issuerMap = new Map(trustedIssuers.map((i) => [i.did, i.name]));

    const enriched = credentials.map((c) => {
      const storedClaims = c.claims as Record<string, unknown> || {};
      return {
        ...c,
        subjectDid: (storedClaims.sub as string) || '',
        typeName: schemaMap.get(c.credentialType) || c.credentialType,
        issuerName: issuerMap.get(c.issuerDid) || null,
      };
    });

    return { credentials: enriched, total: enriched.length };
  }

  async getCredential(id: string) {
    const credential = await this.prisma.walletCredential.findUnique({ where: { id } });
    if (!credential) {
      throw new NotFoundException(`Credential not found: ${id}`);
    }
    return credential;
  }

  async getCredentialClaims(id: string) {
    const credential = await this.getCredential(id);
    const decoded = this.sdJwtService.decode(credential.rawCredential);
    const payloadClaims = decoded.payload as Record<string, unknown>;
    
    const claims: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payloadClaims)) {
      if (!key.startsWith('_') && !['iss', 'sub', 'iat', 'exp', 'vct', 'cnf', 'status'].includes(key)) {
        claims[key] = value;
      }
    }

    for (const disclosure of decoded.disclosures) {
      try {
        const parsed = JSON.parse(Buffer.from(disclosure, 'base64url').toString());
        const claimKey = parsed[1] as string;
        const claimValue = parsed[2];
        if (claimKey && claimValue !== undefined) {
          claims[claimKey] = claimValue;
        }
      } catch {
      }
    }

    const disclosed = Object.entries(claims).map(([key, value]) => ({
      key,
      value,
      selectable: credential.sdClaims.includes(key),
    }));

    return {
      fixedClaims: disclosed.filter((c) => !c.selectable),
      selectiveClaims: disclosed.filter((c) => c.selectable),
    };
  }

  async deleteCredential(id: string) {
    const credential = await this.getCredential(id);
    await this.prisma.walletCredential.delete({ where: { id: credential.id } });
    return { deleted: true };
  }

  async createPresentation(
    verificationRequestId: string,
    holderId: string,
    selectedCredentials: string[],
    disclosedClaims: Record<string, string[]>,
    consent: boolean,
  ): Promise<{
    presentationId: string;
    vpToken: string;
    verificationId: string;
    result: string;
    checks: Record<string, unknown>;
  }> {
    if (!consent) {
      throw new BadRequestException('Consent is required to create a presentation');
    }

    const verificationRequest = await this.prisma.verificationRequest.findUnique({
      where: { id: verificationRequestId },
    });
    if (!verificationRequest) {
      throw new NotFoundException(`Verification request not found: ${verificationRequestId}`);
    }

    const holder = await this.getOrCreateHolderDid(holderId);
    const vpTokenParts: string[] = [];

    for (const credId of selectedCredentials) {
      const walletCred = await this.getCredential(credId);
      const claimsToDisclose = disclosedClaims[credId] || [];

      const presented = await this.sdJwtService.present({
        sdJwtVc: walletCred.rawCredential,
        disclosedClaims: claimsToDisclose,
        nonce: verificationRequest.nonce,
        audience: verificationRequest.verifierDid,
        holderPrivateKey: holder.keyPair.privateKey,
      });

      vpTokenParts.push(presented);
    }

    const vpToken = vpTokenParts.length === 1 ? vpTokenParts[0] : JSON.stringify(vpTokenParts);

    await this.consentService.recordConsent(
      holderId,
      verificationRequest.verifierDid,
      undefined,
      selectedCredentials,
      disclosedClaims,
      'verification',
    );

    const verificationResult = await this.verifierService.handlePresentationResponse(
      vpToken,
      verificationRequest.state,
    );

    return {
      presentationId: verificationRequestId,
      vpToken,
      verificationId: verificationResult.verificationId,
      result: verificationResult.status,
      checks: verificationResult.result as unknown as Record<string, unknown>,
    };
  }

  async getConsentHistory(holderId: string) {
    return this.consentService.getConsentHistory(holderId);
  }
}
