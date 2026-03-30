import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import type { JWK } from 'jose';
import { PrismaService } from '../../prisma/prisma.service';
import { DidService } from '../did/did.service';
import { SdJwtService } from '../crypto/sd-jwt.service';
import { Oid4vciClientService } from './oid4vci-client.service';
import { ConsentService } from './consent.service';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly didService: DidService,
    private readonly sdJwtService: SdJwtService,
    private readonly oid4vciClient: Oid4vciClientService,
    private readonly consentService: ConsentService,
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
  ): Promise<{
    credentialId: string;
    type: string;
    issuerDid: string;
    claims: Record<string, unknown>;
    issuedAt: Date;
  }> {
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
    const claims = decoded.payload as Record<string, unknown>;

    const issuedAt = claims.iat ? new Date((claims.iat as number) * 1000) : new Date();
    const expiresAt = claims.exp ? new Date((claims.exp as number) * 1000) : undefined;

    const walletCred = await this.prisma.walletCredential.create({
      data: {
        holderId,
        rawCredential: credentialResponse.credential,
        format: 'sd-jwt-vc',
        credentialType,
        issuerDid: claims.iss as string,
        claims: JSON.parse(JSON.stringify(claims)),
        sdClaims: decoded.disclosures.map((d) => {
          try {
            const parsed = JSON.parse(Buffer.from(d, 'base64url').toString());
            return parsed[1] as string;
          } catch {
            return d;
          }
        }),
        issuedAt,
        expiresAt,
      },
    });

    return {
      credentialId: walletCred.id,
      type: credentialType,
      issuerDid: claims.iss as string,
      claims,
      issuedAt,
    };
  }

  async listCredentials(holderId: string) {
    const credentials = await this.prisma.walletCredential.findMany({
      where: { holderId },
      orderBy: { createdAt: 'desc' },
    });
    return { credentials, total: credentials.length };
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
    const allClaims = credential.claims as Record<string, unknown>;
    const disclosed = Object.entries(allClaims)
      .filter(([key]) => !key.startsWith('_') && !['iss', 'sub', 'iat', 'exp', 'vct', 'cnf', 'status'].includes(key))
      .map(([key, value]) => ({ key, value, selectable: credential.sdClaims.includes(key) }));

    return {
      disclosed: disclosed.filter((c) => !c.selectable),
      undisclosed: disclosed.filter((c) => c.selectable),
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
  ): Promise<{ presentationId: string; vpToken: string; status: string }> {
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

    await this.prisma.verificationRequest.update({
      where: { id: verificationRequestId },
      data: { status: 'received' },
    });

    return {
      presentationId: verificationRequestId,
      vpToken,
      status: 'submitted',
    };
  }

  async getConsentHistory(holderId: string) {
    return this.consentService.getConsentHistory(holderId);
  }
}
