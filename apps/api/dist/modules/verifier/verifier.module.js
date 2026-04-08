"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifierModule = void 0;
const common_1 = require("@nestjs/common");
const verifier_service_1 = require("./verifier.service");
const verifier_controller_1 = require("./verifier.controller");
const validation_pipeline_service_1 = require("./validation-pipeline.service");
const policy_engine_service_1 = require("./policy-engine.service");
const verification_events_service_1 = require("./verification-events.service");
const did_module_1 = require("../did/did.module");
const crypto_module_1 = require("../crypto/crypto.module");
const trust_module_1 = require("../trust/trust.module");
const status_module_1 = require("../status/status.module");
let VerifierModule = class VerifierModule {
};
exports.VerifierModule = VerifierModule;
exports.VerifierModule = VerifierModule = __decorate([
    (0, common_1.Module)({
        imports: [did_module_1.DidModule, crypto_module_1.CryptoModule, trust_module_1.TrustModule, status_module_1.StatusModule],
        providers: [verifier_service_1.VerifierService, validation_pipeline_service_1.ValidationPipelineService, policy_engine_service_1.PolicyEngineService, verification_events_service_1.VerificationEventsService],
        controllers: [verifier_controller_1.VerifierController],
        exports: [verifier_service_1.VerifierService, verification_events_service_1.VerificationEventsService],
    })
], VerifierModule);
//# sourceMappingURL=verifier.module.js.map