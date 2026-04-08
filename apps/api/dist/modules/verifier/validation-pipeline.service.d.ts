import { DidService } from '../did/did.service';
import { SdJwtService } from '../crypto/sd-jwt.service';
import { TrustService } from '../trust/trust.service';
import { StatusService } from '../status/status.service';
import { PolicyEngineService } from './policy-engine.service';
export interface ValidationResult {
    verified: boolean;
    checks: {
        signature: {
            valid: boolean;
            error?: string;
        };
        expiration: {
            valid: boolean;
            error?: string;
        };
        status: {
            valid: boolean;
            error?: string;
        };
        trust: {
            valid: boolean;
            error?: string;
        };
        policy: {
            valid: boolean;
            error?: string;
        };
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
export declare class ValidationPipelineService {
    private readonly didService;
    private readonly sdJwtService;
    private readonly trustService;
    private readonly statusService;
    private readonly policyEngine;
    constructor(didService: DidService, sdJwtService: SdJwtService, trustService: TrustService, statusService: StatusService, policyEngine: PolicyEngineService);
    validatePresentation(vpToken: string, policies: string[], nonce?: string): Promise<ValidationResult>;
}
//# sourceMappingURL=validation-pipeline.service.d.ts.map