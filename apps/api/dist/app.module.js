"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const configuration_1 = require("./config/configuration");
const database_module_1 = require("./database/database.module");
const did_module_1 = require("./modules/did/did.module");
const crypto_module_1 = require("./modules/crypto/crypto.module");
const issuer_module_1 = require("./modules/issuer/issuer.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const status_module_1 = require("./modules/status/status.module");
const trust_module_1 = require("./modules/trust/trust.module");
const verifier_module_1 = require("./modules/verifier/verifier.module");
const auth_module_1 = require("./modules/auth/auth.module");
const health_module_1 = require("./modules/health/health.module");
const jwt_auth_guard_1 = require("./modules/auth/guards/jwt-auth.guard");
const roles_guard_1 = require("./modules/auth/guards/roles.guard");
const mail_module_1 = require("./modules/mail/mail.module");
const logging_middleware_1 = require("./common/middleware/logging.middleware");
const correlation_id_middleware_1 = require("./common/middleware/correlation-id.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(correlation_id_middleware_1.CorrelationIdMiddleware, logging_middleware_1.LoggingMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.configuration],
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 60,
                }]),
            database_module_1.DatabaseModule,
            mail_module_1.MailModule,
            did_module_1.DidModule,
            crypto_module_1.CryptoModule,
            issuer_module_1.IssuerModule,
            wallet_module_1.WalletModule,
            status_module_1.StatusModule,
            trust_module_1.TrustModule,
            verifier_module_1.VerifierModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
        ],
        providers: [
            { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard },
            { provide: core_1.APP_GUARD, useClass: jwt_auth_guard_1.JwtAuthGuard },
            { provide: core_1.APP_GUARD, useClass: roles_guard_1.RolesGuard },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map