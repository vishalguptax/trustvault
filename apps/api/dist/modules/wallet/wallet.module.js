"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletModule = void 0;
const common_1 = require("@nestjs/common");
const wallet_service_1 = require("./wallet.service");
const wallet_controller_1 = require("./wallet.controller");
const oid4vci_client_service_1 = require("./oid4vci-client.service");
const consent_service_1 = require("./consent.service");
const did_module_1 = require("../did/did.module");
const crypto_module_1 = require("../crypto/crypto.module");
const verifier_module_1 = require("../verifier/verifier.module");
let WalletModule = class WalletModule {
};
exports.WalletModule = WalletModule;
exports.WalletModule = WalletModule = __decorate([
    (0, common_1.Module)({
        imports: [did_module_1.DidModule, crypto_module_1.CryptoModule, (0, common_1.forwardRef)(() => verifier_module_1.VerifierModule)],
        providers: [wallet_service_1.WalletService, oid4vci_client_service_1.Oid4vciClientService, consent_service_1.ConsentService],
        controllers: [wallet_controller_1.WalletController],
        exports: [wallet_service_1.WalletService, oid4vci_client_service_1.Oid4vciClientService],
    })
], WalletModule);
//# sourceMappingURL=wallet.module.js.map