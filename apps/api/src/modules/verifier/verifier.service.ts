import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { ValidationPipelineService } from './validation-pipeline.service';

@Injectable()
export class VerifierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validationPipeline: ValidationPipelineService,
  ) {}

  async createPresentationRequest(
    verifierDid: string,
    credentialTypes: string[],
    requiredClaims?: Record<string, string[]>,
    policies?: string[],
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
        presentationDefinition,
        nonce,
        state,
        requiredCredentialTypes: credentialTypes,
        policies: policies || ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
        status: 'pending',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const authorizationRequestUri = `openid4vp://?request_uri=${encodeURIComponent(`http://localhost:3000/verifier/presentations/${request.id}`)}&nonce=${nonce}`;

    return {
      requestId: request.id,
      authorizationRequestUri,
      nonce,
      state,
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

    await this.prisma.verificationRequest.update({
      where: { id: request.id },
      data: {
        status: result.verified ? 'verified' : 'rejected',
        result: JSON.parse(JSON.stringify(result)),
        completedAt: new Date(),
      },
    });

    return {
      verificationId: request.id,
      status: result.verified ? 'verified' : 'rejected',
      result,
    };
  }

  async getPresentation(id: string) {
    const request = await this.prisma.verificationRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFoundException(`Verification request not found: ${id}`);
    }

    return {
      id: request.id,
      status: request.status,
      result: request.result,
      verifierDid: request.verifierDid,
      requiredCredentialTypes: request.requiredCredentialTypes,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
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
}
