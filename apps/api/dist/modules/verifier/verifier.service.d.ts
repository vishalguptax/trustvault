import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { ValidationPipelineService } from './validation-pipeline.service';
import { VerificationEventsService } from './verification-events.service';
export declare class VerifierService {
    private readonly db;
    private readonly validationPipeline;
    private readonly configService;
    private readonly verificationEvents;
    constructor(db: DatabaseService, validationPipeline: ValidationPipelineService, configService: ConfigService, verificationEvents: VerificationEventsService);
    createPresentationRequest(verifierDid: string, credentialTypes: string[], requiredClaims?: Record<string, string[]>, policies?: string[], verifierName?: string, purpose?: string): Promise<{
        requestId: string;
        authorizationRequestUri: string;
        shareUrl: string;
        nonce: string;
        state: string;
    }>;
    /** Public-facing request details for the shareable verification page */
    getRequestDetails(id: string): Promise<{
        id: string;
        credentialTypes: string[];
        verifierName: string;
        purpose: string;
        requestUri: string;
        status: string;
        expiresAt: string;
    }>;
    handlePresentationResponse(vpToken: string, state: string): Promise<{
        verificationId: string;
        status: string;
        result: import("./validation-pipeline.service").ValidationResult;
    }>;
    listPresentations(verifierDid?: string): Promise<{
        id: string;
        credentialTypes: string[];
        result: string;
        verifierDid: string;
        createdAt: Date;
        completedAt: Date | null;
    }[]>;
    getPresentation(id: string): Promise<{
        id: string;
        result: string;
        checks: {
            name: string;
            label: string;
            passed: boolean;
        }[];
        credentials: {
            type: string;
            issuerDid: string;
            subjectDid: string;
            disclosedClaims: {
                key: string;
                label: string;
                value: string;
            }[];
        }[];
        verifierDid: string;
        nonce: string;
        timestamp: string;
        policies: string[];
    }>;
    createPolicy(name: string, description: string | undefined, rules: Record<string, unknown>): Promise<{
        id: string;
        name: string;
        description: string | null;
        rules: Record<string, unknown>;
        active: boolean;
        createdAt: Date;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
    listPolicies(): Promise<{
        id: string;
        name: string;
        description: string | null;
        rules: Record<string, unknown>;
        active: boolean;
        createdAt: Date;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }[]>;
    updatePolicy(id: string, enabled: boolean): Promise<{
        id: string;
        name: string;
        description: string | null;
        rules: Record<string, unknown>;
        active: boolean;
        createdAt: Date;
        $locals: Record<string, unknown>;
        $op: "save" | "validate" | "remove" | null;
        $where: Record<string, unknown>;
        baseModelName?: string;
        collection: import("mongoose").Collection;
        db: import("mongoose").Connection;
        errors?: import("mongoose").Error.ValidationError;
        isNew: boolean;
        schema: import("mongoose").Schema;
        __v: number;
    }>;
}
//# sourceMappingURL=verifier.service.d.ts.map