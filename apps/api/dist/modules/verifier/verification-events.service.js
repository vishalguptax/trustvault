"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var VerificationEventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationEventsService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let VerificationEventsService = VerificationEventsService_1 = class VerificationEventsService {
    logger = new common_1.Logger(VerificationEventsService_1.name);
    events$ = new rxjs_1.Subject();
    /** Emit a verification result event */
    emit(event) {
        this.logger.log(`Emitting verification event for request ${event.requestId}: ${event.status}`);
        this.events$.next(event);
    }
    /** Subscribe to events for a specific verification request ID */
    subscribe(requestId) {
        this.logger.log(`SSE subscriber connected for request ${requestId}`);
        return this.events$.pipe((0, rxjs_1.filter)((event) => event.requestId === requestId), (0, rxjs_1.map)((event) => ({
            data: JSON.stringify(event),
        })));
    }
};
exports.VerificationEventsService = VerificationEventsService;
exports.VerificationEventsService = VerificationEventsService = VerificationEventsService_1 = __decorate([
    (0, common_1.Injectable)()
], VerificationEventsService);
//# sourceMappingURL=verification-events.service.js.map