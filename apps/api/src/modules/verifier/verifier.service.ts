import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import { DatabaseService } from '../../database/database.service';
import { ValidationPipelineService } from './validation-pipeline.service';
import { VerificationEventsService } from './verification-events.service';

@Injectable()
export class VerifierService {
  constructor(
    private readonly db: DatabaseService,
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

    const request = await this.db.verificationRequest.create({
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
    });

    const requestId = request._id.toString();
    const apiBaseUrl = this.configService.get<string>('apiBaseUrl');
    const requestUri = `${apiBaseUrl}/verifier/presentations/${requestId}`;

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
    const shareUrl = `${webAppUrl}/verify/${requestId}`;

    return {
      requestId,
      authorizationRequestUri,
      shareUrl,
      nonce,
      state,
    };
  }

  /** Public-facing request details for the shareable verification page */
  async getRequestDetails(id: string) {
    const request = await this.db.verificationRequest.findById(id).lean();

    if (!request) {
      throw new NotFoundException(`Verification request not found: ${id}`);
    }

    const requestId = request._id.toString();
    const apiBaseUrl = this.configService.get<string>('apiBaseUrl');
    const requestUri = `${apiBaseUrl}/verifier/presentations/${requestId}`;

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
      id: requestId,
      credentialTypes: request.requiredCredentialTypes,
      verifierName: request.verifierName ?? 'Verifier',
      purpose: request.purpose ?? 'Credential verification',
      requestUri: walletUri,
      status: request.status,
      expiresAt: request.expiresAt?.toISOString() ?? null,
    };
  }

  async handlePresentationResponse(vpToken: string, state: string) {
    const request = await this.db.verificationRequest.findOne({ state }).lean();

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
    const requestId = request._id.toString();

    await this.db.verificationRequest.findByIdAndUpdate(request._id, {
      $set: {
        status,
        result: JSON.parse(JSON.stringify(result)),
        completedAt,
      },
    }, { new: true }).lean();

    // Emit SSE event so the verifier's browser updates in real-time
    this.verificationEvents.emit({
      requestId,
      verificationId: requestId,
      status: status as 'verified' | 'rejected',
      result: result.checks ?? {},
      completedAt: completedAt.toISOString(),
    });

    return {
      verificationId: requestId,
      status,
      result,
    };
  }

  async listPresentations(verifierDid?: string) {
    const where = verifierDid ? { verifierDid } : {};
    const requests = await this.db.verificationRequest.find(where).sort({ createdAt: -1 }).lean();

    return requests.map((r) => ({
      id: r._id.toString(),
      credentialTypes: r.requiredCredentialTypes,
      result: r.status === 'verified' ? 'verified' : r.status === 'rejected' ? 'rejected' : 'pending',
      verifierDid: r.verifierDid,
      createdAt: r.createdAt,
      completedAt: r.completedAt,
    }));
  }

  async getPresentation(id: string) {
    const request = await this.db.verificationRequest.findById(id).lean();

    if (!request) {
      throw new NotFoundException(`Verification request not found: ${id}`);
    }

    const requestId = request._id.toString();

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
      id: requestId,
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
    const policy = await this.db.verifierPolicy.create({
      name,
      description,
      rules: JSON.parse(JSON.stringify(rules)),
      active: true,
    });
    const doc = policy.toObject();
    return { ...doc, id: doc._id.toString() };
  }

  async listPolicies() {
    const policies = await this.db.verifierPolicy.find({ active: true }).lean();
    return policies.map((p) => ({ ...p, id: p._id.toString() }));
  }

  async updatePolicy(id: string, enabled: boolean) {
    const policy = await this.db.verifierPolicy.findById(id).lean();
    if (!policy) {
      throw new NotFoundException(`Policy not found: ${id}`);
    }
    const updated = await this.db.verifierPolicy.findByIdAndUpdate(id, { $set: { active: enabled } }, { new: true }).lean();
    if (!updated) {
      throw new NotFoundException(`Policy not found: ${id}`);
    }
    return { ...updated, id: updated._id.toString() };
  }
}
