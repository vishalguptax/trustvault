"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("@nestjs/config");
const user_schema_1 = require("./schemas/user.schema");
const did_schema_1 = require("./schemas/did.schema");
const credential_schema_schema_1 = require("./schemas/credential-schema.schema");
const credential_offer_schema_1 = require("./schemas/credential-offer.schema");
const issued_credential_schema_1 = require("./schemas/issued-credential.schema");
const status_list_schema_1 = require("./schemas/status-list.schema");
const trusted_issuer_schema_1 = require("./schemas/trusted-issuer.schema");
const trust_policy_schema_1 = require("./schemas/trust-policy.schema");
const wallet_credential_schema_1 = require("./schemas/wallet-credential.schema");
const wallet_did_schema_1 = require("./schemas/wallet-did.schema");
const consent_record_schema_1 = require("./schemas/consent-record.schema");
const verification_request_schema_1 = require("./schemas/verification-request.schema");
const verifier_policy_schema_1 = require("./schemas/verifier-policy.schema");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
let DatabaseService = DatabaseService_1 = class DatabaseService {
    configService;
    logger = new common_1.Logger(DatabaseService_1.name);
    connection = null;
    // Models
    user;
    did;
    credentialSchema;
    credentialOffer;
    issuedCredential;
    statusList;
    trustedIssuer;
    trustPolicy;
    walletCredential;
    walletDid;
    consentRecord;
    verificationRequest;
    verifierPolicy;
    auditLog;
    constructor(configService) {
        this.configService = configService;
        const conn = mongoose_1.default.connection;
        this.user = conn.model('User', user_schema_1.UserSchema);
        this.did = conn.model('Did', did_schema_1.DidSchema);
        this.credentialSchema = conn.model('CredentialSchema', credential_schema_schema_1.CredentialSchemaSchema);
        this.credentialOffer = conn.model('CredentialOffer', credential_offer_schema_1.CredentialOfferSchema);
        this.issuedCredential = conn.model('IssuedCredential', issued_credential_schema_1.IssuedCredentialSchema);
        this.statusList = conn.model('StatusList', status_list_schema_1.StatusListSchema);
        this.trustedIssuer = conn.model('TrustedIssuer', trusted_issuer_schema_1.TrustedIssuerSchema);
        this.trustPolicy = conn.model('TrustPolicy', trust_policy_schema_1.TrustPolicySchema);
        this.walletCredential = conn.model('WalletCredential', wallet_credential_schema_1.WalletCredentialSchema);
        this.walletDid = conn.model('WalletDid', wallet_did_schema_1.WalletDidSchema);
        this.consentRecord = conn.model('ConsentRecord', consent_record_schema_1.ConsentRecordSchema);
        this.verificationRequest = conn.model('VerificationRequest', verification_request_schema_1.VerificationRequestSchema);
        this.verifierPolicy = conn.model('VerifierPolicy', verifier_policy_schema_1.VerifierPolicySchema);
        this.auditLog = conn.model('AuditLog', audit_log_schema_1.AuditLogSchema);
    }
    async connect() {
        try {
            const uri = this.configService.get('database.url');
            if (!uri) {
                throw new Error('DATABASE_URL is not set');
            }
            await mongoose_1.default.connect(uri);
            this.connection = mongoose_1.default.connection;
            this.logger.log('MongoDB connected');
        }
        catch (error) {
            this.connection = null;
            const msg = error instanceof Error ? error.message : String(error);
            this.logger.error(`MongoDB connection failed: ${msg}`);
        }
    }
    isConnected() {
        return mongoose_1.default.connection.readyState === 1;
    }
    async ping() {
        try {
            if (!this.isConnected())
                return false;
            await mongoose_1.default.connection.db.admin().ping();
            return true;
        }
        catch {
            return false;
        }
    }
    async onModuleDestroy() {
        await mongoose_1.default.disconnect();
        this.logger.log('MongoDB disconnected');
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = DatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DatabaseService);
//# sourceMappingURL=database.service.js.map