import { Observable } from 'rxjs';
import { VerifierService } from './verifier.service';
import { VerificationEventsService } from './verification-events.service';
declare class CreatePresentationRequestDto {
    verifierDid?: string;
    credentialTypes: string[];
    requiredClaims?: Record<string, string[]>;
    policies?: string[];
    verifierName?: string;
    purpose?: string;
}
declare class PresentationResponseDto {
    vp_token: string;
    presentation_submission?: Record<string, unknown>;
    state: string;
}
declare class UpdatePolicyDto {
    enabled: boolean;
}
declare class CreatePolicyDto {
    name: string;
    description?: string;
    rules: Record<string, unknown>;
}
export declare class VerifierController {
    private readonly verifierService;
    private readonly verificationEvents;
    constructor(verifierService: VerifierService, verificationEvents: VerificationEventsService);
    createRequest(dto: CreatePresentationRequestDto, user: {
        id: string;
        name: string;
        role: string;
    }): Promise<{
        data: {
            requestId: string;
            requestUri: string;
            shareUrl: string;
            nonce: string;
            state: string;
        };
    }>;
    handleResponse(dto: PresentationResponseDto): Promise<{
        data: {
            verificationId: string;
            status: string;
            result: import("./validation-pipeline.service").ValidationResult;
        };
    }>;
    listPresentations(user: {
        id: string;
        role: string;
    }): Promise<{
        data: {
            id: string;
            credentialTypes: string[];
            result: string;
            verifierDid: string;
            createdAt: Date;
            completedAt: Date | null;
        }[];
    }>;
    getPresentation(id: string): Promise<{
        data: {
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
        };
    }>;
    getRequestDetails(id: string): Promise<{
        data: {
            id: string;
            credentialTypes: string[];
            verifierName: string;
            purpose: string;
            requestUri: string;
            status: string;
            expiresAt: string;
        };
    }>;
    streamPresentation(id: string): Observable<MessageEvent>;
    createPolicy(dto: CreatePolicyDto): Promise<{
        data: {
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
        };
    }>;
    listPolicies(): Promise<{
        data: {
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
        }[];
    }>;
    updatePolicy(id: string, dto: UpdatePolicyDto): Promise<{
        data: {
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
        };
    }>;
}
export {};
//# sourceMappingURL=verifier.controller.d.ts.map