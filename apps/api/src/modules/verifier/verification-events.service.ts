import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable, filter, map } from 'rxjs';

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

@Injectable()
export class VerificationEventsService {
  private readonly logger = new Logger(VerificationEventsService.name);
  private readonly events$ = new Subject<VerificationEvent>();

  /** Emit a verification result event */
  emit(event: VerificationEvent): void {
    this.logger.log(`Emitting verification event for request ${event.requestId}: ${event.status}`);
    this.events$.next(event);
  }

  /** Subscribe to events for a specific verification request ID */
  subscribe(requestId: string): Observable<MessageEvent> {
    this.logger.log(`SSE subscriber connected for request ${requestId}`);

    return this.events$.pipe(
      filter((event) => event.requestId === requestId),
      map((event) => ({
        data: JSON.stringify(event),
      } as MessageEvent)),
    );
  }
}
