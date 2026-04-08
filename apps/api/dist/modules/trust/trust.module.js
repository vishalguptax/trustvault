"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrustModule = void 0;
const common_1 = require("@nestjs/common");
const trust_service_1 = require("./trust.service");
const trust_controller_1 = require("./trust.controller");
const issuer_module_1 = require("../issuer/issuer.module");
const auth_module_1 = require("../auth/auth.module");
const did_module_1 = require("../did/did.module");
let TrustModule = class TrustModule {
};
exports.TrustModule = TrustModule;
exports.TrustModule = TrustModule = __decorate([
    (0, common_1.Module)({
        imports: [issuer_module_1.IssuerModule, auth_module_1.AuthModule, did_module_1.DidModule],
        providers: [trust_service_1.TrustService],
        controllers: [trust_controller_1.TrustController],
        exports: [trust_service_1.TrustService],
    })
], TrustModule);
//# sourceMappingURL=trust.module.js.map