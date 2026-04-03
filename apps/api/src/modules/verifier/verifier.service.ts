import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidationPipelineService } from './validation-pipeline.service';
import { VerificationEventsService } from './verification-events.service';

@Injectable()
export class VerifierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationPipeline: ValidationPipelineService,
    private readonly configService: ConfigService,
    private readonly verificationEvents: VerificationEventsService,
  ) {}

  async createPresentationRequest(
    verifierDid: string,
    credentialTypes: string[],
    requiredClaims?: Record<string, string[]>,
    policies?: string[],
    verifierName?: string,
    purpose?: string,
  ) {
    const nonce = randomBytes(16).toString('base64url');
    const state = randomBytes(16).toString('base64url');

    const presentationDefinition = {
      id: `pd-${state}`,
      input_descriptors: credentialTypes.map((type, index) => ({
        id: `descriptor-${index}`,
        format: { 'vc+sd-jwt': { alg: ['ES256'] } },
        constraints: {
          fields: [
            { path: ['$.vct'], filter: { type: 'string', const: type } },
            ...(requiredClaims?.[type] || []).map((claim) => ({
              path: [`$.${claim}`],
            })),
          ],
        },
      })),
    };

    const request = await this.prisma.verificationRequest.create({
      data: {
        verifierDid,
        verifierName: verifierName ?? null,
        purpose: purpose ?? null,
        presentationDefinition,
        nonce,
        state,
        requiredCredentialTypes: credentialTypes,
        policies: policies || ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
        status: 'pending',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const apiBaseUrl = this.configService.get<string>('apiBaseUrl');
    const requestUri = `${apiBaseUrl}/verifier/presentations/${request.id}`;

    const uriParams = new URLSearchParams();
    uriParams.set('request_uri', requestUri);
    uriParams.set('nonce', nonce);
    uriParams.set('verifier_did', verifierDid);
    uriParams.set('credential_types', credentialTypes.join(','));
    if (verifierName) {
      uriParams.set('verifier_name', verifierName);
    }
    if (purpose) {
      uriParams.set('purpose', purpose);
    }

    const authorizationRequestUri = `openid4vp://?${uriParams.toString()}`;

    const webAppUrl = this.configService.get<string>('webAppUrl') ?? 'http://localhost:3000';
    const shareUrl = `${webAppUrl}/verify/${request.id}`;

    return {
      requestId: request.id,
      authorizationRequestUri,
      shareUrl,
      nonce,
      state,
    };
  }

  /** Public-facing request details for the shareable verification page */
  async getRequestDetails(id: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Verification request not found: ${id}`);
    }

    const apiBaseUrl = this.configService.get<string>('apiBaseUrl');
    const requestUri = `${apiBaseUrl}/verifier/presentations/${request.id}`;

    // Rebuild the openid4vp:// URI for the share page
    const uriParams = new URLSearchParams();
    uriParams.set('request_uri', requestUri);
    uriParams.set('nonce', request.nonce);
    if (request.verifierDid) uriParams.set('verifier_did', request.verifierDid);
    uriParams.set('credential_types', request.requiredCredentialTypes.join(','));
    if (request.verifierName) uriParams.set('verifier_name', request.verifierName);
    if (request.purpose) uriParams.set('purpose', request.purpose);
    const walletUri = `openid4vp://?${uriParams.toString()}`;

    return {
      id: request.id,
      credentialTypes: request.requiredCredentialTypes,
      verifierName: request.verifierName ?? 'Verifier',
      purpose: request.purpose ?? 'Credential verification',
      requestUri: walletUri,
      status: request.status,
      expiresAt: request.expiresAt?.toISOString() ?? null,
    };
  }

  async handlePresentationResponse(vpToken: string, state: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { state },
    });

    if (!request) {
      throw new NotFoundException(`Verification request not found for state: ${state}`);
    }

    const result = await this.validationPipeline.validatePresentation(
      vpToken,
      request.policies,
      request.nonce,
    );

    const completedAt = new Date();
    const status = result.verified ? 'verified' : 'rejected';

    await this.prisma.verificationRequest.update({
      where: { id: request.id },
      data: {
        status,
        result: JSON.parse(JSON.stringify(result)),
        completedAt,
      },
    });

    // Emit SSE event so the verifier's browser updates in real-time
    this.verificationEvents.emit({
      requestId: request.id,
      verificationId: request.id,
      status: status as 'verified' | 'rejected',
      result: result.checks ?? {},
      completedAt: completedAt.toISOString(),
    });

    return {
      verificationId: request.id,
      status,
      result,
    };
  }

  async listPresentations(verifierDid?: string) {
    const where = verifierDid ? { verifierDid } : {};
    const requests = await this.prisma.verificationRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      credentialTypes: r.requiredCredentialTypes,
      result: r.status === 'verified' ? 'verified' : r.status === 'rejected' ? 'rejected' : 'pending',
      verifierDid: r.verifierDid,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }));
  }

  async getPresentation(id: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Verification request not found: ${id}`);
    }

    // Map stored ValidationResult to the shape the frontend expects
    const rawResult = request.result as Record<string, unknown> | null;
    const rawChecks = (rawResult?.checks ?? {}) as Record<string, { valid: boolean; error?: string }>;
    const rawCredentials = (rawResult?.credentials ?? []) as Array<{
      credentialType?: string;
      issuerDid?: string;
      subjectDid?: string;
      disclosedClaims?: Record<string, unknown>;
    }>;

    const checks = Object.entries(rawChecks).map(([name, check]) => ({
      name,
      label: name.charAt(0).toUpperCase() + name.slice(1),
      passed: check.valid,
    }));

    const credentials = rawCredentials.map((cred) => ({
      type: cred.credentialType ?? 'Unknown',
      issuerDid: cred.issuerDid ?? '',
      subjectDid: cred.subjectDid ?? '',
      disclosedClaims: Object.entries(cred.disclosedClaims ?? {}).map(([key, value]) => ({
        key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
        value: String(value),
      })),
    }));

    const isVerified = rawResult?.verified === true;

    return {
      id: request.id,
      result: isVerified ? 'verified' : request.status === 'pending' ? 'pending' : 'rejected',
      checks,
      credentials,
      verifierDid: request.verifierDid,
      nonce: request.nonce,
      timestamp: request.completedAt?.toISOString() ?? request.createdAt.toISOString(),
      policies: request.policies,
    };
  }

  async createPolicy(name: string, description: string | undefined, rules: Record<string, unknown>) {
    return this.prisma.verifierPolicy.create({
      data: { name, description, rules: JSON.parse(JSON.stringify(rules)), active: true },
    });
  }

  async listPolicies() {
    return this.prisma.verifierPolicy.findMany({ where: { active: true } });
  }

  async updatePolicy(id: string, enabled: boolean) {
    const policy = await this.prisma.verifierPolicy.findUnique({ where: { id } });
    if (!policy) {
      throw new NotFoundException(`Policy not found: ${id}`);
    }
    return this.prisma.verifierPolicy.update({
      where: { id },
      data: { active: enabled },
    });
  }
}
