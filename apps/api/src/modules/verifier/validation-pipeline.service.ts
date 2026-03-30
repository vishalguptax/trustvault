import { Injectable } from '@nestjs/common';
import type { JWK } from 'jose';
import { DidService } from '../did/did.service';
import { SdJwtService } from '../crypto/sd-jwt.service';
import { TrustService } from '../trust/trust.service';
import { StatusService } from '../status/status.service';
import { PolicyEngineService } from './policy-engine.service';

export interface ValidationResult {
  verified: boolean;
  checks: {
    signature: { valid: boolean; error?: string };
    expiration: { valid: boolean; error?: string };
    status: { valid: boolean; error?: string };
    trust: { valid: boolean; error?: string };
    policy: { valid: boolean; error?: string };
  };
  credentials: ValidatedCredential[];
}

export interface ValidatedCredential {
  credentialType: string;
  issuerDid: string;
  subjectDid: string;
  disclosedClaims: Record<string, unknown>;
  issuedAt: string;
  expiresAt?: string;
}

@Injectable()
export class ValidationPipelineService {
  constructor(
    private readonly didService: DidService,
    private readonly sdJwtService: SdJwtService,
    private readonly trustService: TrustService,
    private readonly statusService: StatusService,
    private readonly policyEngine: PolicyEngineService,
  ) {}

  async validatePresentation(
    vpToken: string,
    policies: string[],
    nonce?: string,
  ): Promise<ValidationResult> {
    const credentials: ValidatedCredential[] = [];
    const checks = {
      signature: { valid: true, error: undefined as string | undefined },
      expiration: { valid: true, error: undefined as string | undefined },
      status: { valid: true, error: undefined as string | undefined },
      trust: { valid: true, error: undefined as string | undefined },
      policy: { valid: true, error: undefined as string | undefined },
    };

    let sdJwtTokens: string[];
    try {
      const parsed = JSON.parse(vpToken);
      sdJwtTokens = Array.isArray(parsed) ? parsed : [vpToken];
    } catch {
      sdJwtTokens = [vpToken];
    }

    for (const sdJwtVc of sdJwtTokens) {
      const decoded = this.sdJwtService.decode(sdJwtVc);
      const payload = decoded.payload;
      const issuerDid = payload.iss as string;
      const credentialType = payload.vct as string;

      // 1. Signature verification
      let issuerPublicKey: JWK;
      try {
        issuerPublicKey = await this.didService.getPublicKey(issuerDid);
        const sigResult = await this.sdJwtService.verify(sdJwtVc, issuerPublicKey);
        if (!sigResult.valid) {
          checks.signature = { valid: false, error: sigResult.error || 'Signature verification failed' };
        }
      } catch (error) {
        checks.signature = {
          valid: false,
          error: error instanceof Error ? error.message : 'Could not verify signature',
        };
        continue;
      }

      // 2. Expiration check
      if (payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if ((payload.exp as number) < now) {
          checks.expiration = { valid: false, error: 'Credential has expired' };
        }
      }

      // 3. Status check (revocation)
      const statusInfo = payload.status as { status_list?: { idx: number; uri: string } } | undefined;
      if (statusInfo?.status_list) {
        const isActive = await this.statusService.checkStatus(
          statusInfo.status_list.uri,
          statusInfo.status_list.idx,
        );
        if (!isActive) {
          checks.status = { valid: false, error: 'Credential has been revoked' };
        }
      }

      // 4. Trust check
      const trustResult = await this.trustService.verifyTrust(issuerDid, credentialType);
      if (!trustResult.trusted) {
        checks.trust = { valid: false, error: trustResult.reason };
      }

      // 5. Policy evaluation
      const policyResult = await this.policyEngine.evaluatePolicies(policies, {
        trustResult,
        statusResult: checks.status,
        expirationResult: checks.expiration,
      });
      if (!policyResult.allPassed) {
        const failedPolicies = policyResult.results.filter((r) => !r.valid);
        checks.policy = {
          valid: false,
          error: failedPolicies.map((p) => `${p.policy}: ${p.error}`).join('; '),
        };
      }

      // Collect disclosed claims
      const disclosedClaims: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(payload)) {
        if (!['iss', 'sub', 'iat', 'exp', 'vct', 'cnf', 'status', '_sd', '_sd_alg'].includes(key)) {
          disclosedClaims[key] = value;
        }
      }

      credentials.push({
        credentialType,
        issuerDid,
        subjectDid: payload.sub as string,
        disclosedClaims,
        issuedAt: payload.iat ? new Date((payload.iat as number) * 1000).toISOString() : new Date().toISOString(),
        expiresAt: payload.exp ? new Date((payload.exp as number) * 1000).toISOString() : undefined,
      });
    }

    const verified =
      checks.signature.valid &&
      checks.expiration.valid &&
      checks.status.valid &&
      checks.trust.valid &&
      checks.policy.valid;

    return { verified, checks, credentials };
  }
}
