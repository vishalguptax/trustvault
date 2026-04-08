import { Observable } from 'rxjs';
/**
 * In-memory event bus for real-time verification result notifications.
 * Uses RxJS Subject to broadcast events to SSE subscribers.
 *
 * Flow:
 * 1. Verifier creates a request → frontend opens SSE connection to /stream
 * 2. Wallet submits presentation → verifier service validates → emits event
 * 3. SSE connection delivers the result to the verifier's browser instantly
 */
export interface VerificationEvent {
    requestId: string;
    verificationId: string;
    status: 'verified' | 'rejected';
    result: Record<string, unknown>;
    completedAt: string;
}
export declare class VerificationEventsService {
    private readonly logger;
    private readonly events$;
    /** Emit a verification result event */
    emit(event: VerificationEvent): void;
    /** Subscribe to events for a specific verification request ID */
    subscribe(requestId: string): Observable<MessageEvent>;
}
//# sourceMappingURL=verification-events.service.d.ts.map