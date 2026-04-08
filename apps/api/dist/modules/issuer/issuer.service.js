"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IssuerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const jose = __importStar(require("jose"));
const database_service_1 = require("../../database/database.service");
const did_service_1 = require("../did/did.service");
const sd_jwt_service_1 = require("../crypto/sd-jwt.service");
const constants_1 = require("../../common/constants");
let IssuerService = class IssuerService {
    db;
    didService;
    sdJwtService;
    configService;
    constructor(db, didService, sdJwtService, configService) {
        this.db = db;
        this.didService = didService;
        this.sdJwtService = sdJwtService;
        this.configService = configService;
    }
    async getOrCreateIssuerDid() {
        const configured = this.configService.get('issuer.did');
        if (configured) {
            return configured;
        }
        const existing = await this.db.did.findOne({ method: 'key', active: true }).sort({ createdAt: 1 }).lean();
        if (existing) {
            return existing.did;
        }
        const result = await this.didService.createDid('key');
        return result.did;
    }
    async getIssuerMetadata() {
        const issuerDid = await this.getOrCreateIssuerDid();
        const baseUrl = this.configService.get('issuer.baseUrl');
        const schemas = await this.db.credentialSchema.find({ active: true }).lean();
        const credentialConfigurations = {};
        for (const schema of schemas) {
            credentialConfigurations[schema.typeUri] = {
                format: 'vc+sd-jwt',
                scope: schema.typeUri,
                cryptographic_binding_methods_supported: ['did:key'],
                credential_signing_alg_values_supported: [constants_1.SIGNING_ALGORITHM],
                credential_definition: {
                    type: [schema.typeUri],
                },
                display: [
                    {
                        name: schema.name,
                        locale: 'en-US',
                    },
                ],
            };
        }
        return {
            credential_issuer: baseUrl,
            credential_endpoint: `${baseUrl}/credential`,
            token_endpoint: `${baseUrl}/token`,
            credential_configurations_supported: credentialConfigurations,
            display: [
                {
                    name: 'TrustiLock Issuer',
                    locale: 'en-US',
                },
            ],
            issuer_did: issuerDid,
        };
    }
    /**
     * Verify that the calling user is authorized to issue the given credential type.
     * Admins bypass this check. Issuers must be linked to a trusted issuer entry
     * that includes the requested credential type.
     */
    async verifyIssuerAuthorization(userId, schemaTypeUri) {
        const user = await this.db.user.findById(userId).lean();
        if (!user) {
            throw new common_1.ForbiddenException('User not found');
        }
        if (user.role === 'admin') {
            return; // Admins can issue any credential type
        }
        if (!user.trustedIssuerId) {
            throw new common_1.ForbiddenException('You are not linked to a trusted issuer. Contact an administrator.');
        }
        const issuer = await this.db.trustedIssuer.findById(user.trustedIssuerId).lean();
        if (!issuer || issuer.status !== 'active') {
            throw new common_1.ForbiddenException('Your issuer account is not active in the trust registry.');
        }
        if (!issuer.credentialTypes.includes(schemaTypeUri)) {
            throw new common_1.ForbiddenException(`You are not authorized to issue ${schemaTypeUri}. Authorized types: ${issuer.credentialTypes.join(', ')}`);
        }
    }
    async createOffer(schemaTypeUri, subjectDid, claims, pinRequired = false, userId) {
        if (userId) {
            await this.verifyIssuerAuthorization(userId, schemaTypeUri);
        }
        const schema = await this.db.credentialSchema.findOne({ typeUri: schemaTypeUri }).lean();
        if (!schema) {
            throw new common_1.NotFoundException(`Credential schema not found: ${schemaTypeUri}`);
        }
        const issuerDid = await this.getOrCreateIssuerDid();
        const preAuthorizedCode = (0, crypto_1.randomBytes)(32).toString('base64url');
        const baseUrl = this.configService.get('issuer.baseUrl');
        const offer = await this.db.credentialOffer.create({
            issuerDid,
            schemaTypeUri,
            preAuthorizedCode,
            pinRequired,
            claims: JSON.parse(JSON.stringify(claims)),
            status: 'pending',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });
        const credentialOfferPayload = {
            credential_issuer: baseUrl,
            credential_configuration_ids: [schemaTypeUri],
            grants: {
                'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
                    'pre-authorized_code': preAuthorizedCode,
                    user_pin_required: pinRequired,
                },
            },
            subject_did: subjectDid,
        };
        const credentialOfferUri = `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(credentialOfferPayload))}`;
        return {
            offerId: offer._id.toString(),
            credentialOfferUri,
            preAuthorizedCode,
        };
    }
    async createBulkOffers(schemaTypeUri, offers, userId) {
        const results = [];
        let successful = 0;
        let failed = 0;
        // Verify authorization once for the entire batch
        if (userId) {
            await this.verifyIssuerAuthorization(userId, schemaTypeUri);
        }
        for (let i = 0; i < offers.length; i++) {
            try {
                const result = await this.createOffer(schemaTypeUri, 'pending', // subjectDid — resolved during OID4VCI flow
                offers[i].claims, false);
                results.push({
                    index: i,
                    offerId: result.offerId,
                    credentialOfferUri: result.credentialOfferUri,
                });
                successful++;
            }
            catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error';
                results.push({ index: i, error: message });
                failed++;
            }
        }
        return {
            total: offers.length,
            successful,
            failed,
            results,
        };
    }
    async exchangeToken(preAuthorizedCode, pin) {
        const offer = await this.db.credentialOffer.findOne({ preAuthorizedCode }).lean();
        if (!offer) {
            throw new common_1.BadRequestException('Invalid pre-authorized code');
        }
        if (offer.status !== 'pending') {
            throw new common_1.BadRequestException(`Offer already used or expired. Status: ${offer.status}`);
        }
        if (new Date() > offer.expiresAt) {
            await this.db.credentialOffer.findByIdAndUpdate(offer._id, { $set: { status: 'expired' } }, { new: true }).lean();
            throw new common_1.BadRequestException('Offer has expired');
        }
        if (offer.pinRequired && !pin) {
            throw new common_1.BadRequestException('PIN is required');
        }
        const accessToken = (0, crypto_1.randomBytes)(32).toString('base64url');
        const cNonce = (0, crypto_1.randomBytes)(16).toString('base64url');
        await this.db.credentialOffer.findByIdAndUpdate(offer._id, {
            $set: {
                accessToken,
                cNonce,
                status: 'token_issued',
            },
        }, { new: true }).lean();
        return {
            access_token: accessToken,
            token_type: 'Bearer',
            expires_in: 300,
            c_nonce: cNonce,
            c_nonce_expires_in: 300,
        };
    }
    async issueCredential(accessToken, format, credentialDefinition, proof) {
        const offer = await this.db.credentialOffer.findOne({ accessToken }).lean();
        if (!offer) {
            throw new common_1.UnauthorizedException('Invalid access token');
        }
        if (offer.status !== 'token_issued') {
            throw new common_1.BadRequestException(`Invalid offer status: ${offer.status}`);
        }
        const schema = await this.db.credentialSchema.findOne({ typeUri: offer.schemaTypeUri }).lean();
        if (!schema) {
            throw new common_1.NotFoundException(`Schema not found: ${offer.schemaTypeUri}`);
        }
        let holderPublicKey;
        let holderDid;
        if (proof?.jwt) {
            try {
                const decoded = jose.decodeJwt(proof.jwt);
                const header = jose.decodeProtectedHeader(proof.jwt);
                if (header.jwk) {
                    holderPublicKey = header.jwk;
                }
                if (decoded.iss) {
                    holderDid = decoded.iss;
                }
            }
            catch {
                throw new common_1.BadRequestException('Invalid proof JWT');
            }
        }
        const issuerKeyPair = await this.didService.getKeyPair(offer.issuerDid);
        const claims = offer.claims;
        const subjectDid = holderDid || claims.subjectDid || 'unknown';
        const expiryDays = this.configService.get('credential.defaultExpiryDays') || 365;
        const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
        const sdJwtVc = await this.sdJwtService.issue({
            issuerDid: offer.issuerDid,
            subjectDid,
            credentialType: offer.schemaTypeUri,
            claims,
            disclosableClaims: schema.sdClaims,
            holderPublicKey,
            issuerPrivateKey: issuerKeyPair.privateKey,
            expiresAt,
        });
        const credentialHash = (0, crypto_1.createHash)('sha256').update(sdJwtVc).digest('hex');
        const newCNonce = (0, crypto_1.randomBytes)(16).toString('base64url');
        await this.db.issuedCredential.create({
            issuerDid: offer.issuerDid,
            subjectDid,
            schemaTypeUri: offer.schemaTypeUri,
            credentialHash,
            status: 'active',
            expiresAt,
        });
        await this.db.credentialOffer.findByIdAndUpdate(offer._id, {
            $set: { status: 'credential_issued', cNonce: newCNonce },
        }, { new: true }).lean();
        return {
            credential: sdJwtVc,
            c_nonce: newCNonce,
            c_nonce_expires_in: 300,
        };
    }
    toSchemaDto(schema) {
        const schemaJson = schema.schema;
        const claims = Object.entries(schemaJson).map(([key, def]) => ({
            key,
            label: def.label || key,
            type: def.type || 'string',
            required: def.required ?? true,
            selectivelyDisclosable: schema.sdClaims.includes(key),
        }));
        return {
            id: schema._id.toString(),
            type: schema.typeUri,
            name: schema.name,
            description: schema.description || '',
            claims,
        };
    }
    async listSchemas() {
        const schemas = await this.db.credentialSchema.find({ active: true }).lean();
        return schemas.map((s) => this.toSchemaDto(s));
    }
    async getSchema(id) {
        const schema = await this.db.credentialSchema.findById(id).lean();
        if (!schema) {
            throw new common_1.NotFoundException(`Schema not found: ${id}`);
        }
        return this.toSchemaDto(schema);
    }
    async getOfferPreview(preAuthorizedCode) {
        const offer = await this.db.credentialOffer.findOne({ preAuthorizedCode }).lean();
        if (!offer) {
            throw new common_1.NotFoundException('Credential offer not found');
        }
        const schema = await this.db.credentialSchema.findOne({ typeUri: offer.schemaTypeUri }).lean();
        const trustedIssuer = await this.db.trustedIssuer.findOne({ did: offer.issuerDid }).lean();
        const claims = offer.claims;
        const claimKeys = Object.keys(claims).filter((k) => !['subjectDid', 'documentName'].includes(k));
        return {
            issuerName: trustedIssuer?.name ?? null,
            issuerDid: offer.issuerDid,
            credentialType: offer.schemaTypeUri,
            credentialTypeName: schema?.name ?? offer.schemaTypeUri,
            documentName: claims.documentName ?? null,
            claims: claimKeys,
            claimValues: claims,
            status: offer.status,
            expiresAt: offer.expiresAt,
        };
    }
    async listOffers() {
        const offers = await this.db.credentialOffer.find({}).sort({ createdAt: -1 }).lean();
        const baseUrl = this.configService.get('issuer.baseUrl');
        return offers.map((offer) => {
            const claims = offer.claims;
            const isExpired = offer.status === 'pending' && new Date() > offer.expiresAt;
            const credentialOfferPayload = {
                credential_issuer: baseUrl,
                credential_configuration_ids: [offer.schemaTypeUri],
                grants: {
                    'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
                        'pre-authorized_code': offer.preAuthorizedCode,
                        user_pin_required: offer.pinRequired,
                    },
                },
                subject_did: 'pending',
            };
            const credentialOfferUri = `openid-credential-offer://?credential_offer=${encodeURIComponent(JSON.stringify(credentialOfferPayload))}`;
            return {
                id: offer._id.toString(),
                schemaTypeUri: offer.schemaTypeUri,
                status: isExpired ? 'expired' : offer.status,
                claims,
                credentialOfferUri: (offer.status === 'pending' && !isExpired) ? credentialOfferUri : null,
                preAuthorizedCode: offer.preAuthorizedCode,
                createdAt: offer.createdAt,
                expiresAt: offer.expiresAt,
            };
        });
    }
    async listIssuedCredentials(issuerDid) {
        const where = issuerDid ? { issuerDid } : {};
        const credentials = await this.db.issuedCredential.find(where).sort({ issuedAt: -1 }).lean();
        return credentials.map((c) => ({
            id: c._id.toString(),
            type: c.schemaTypeUri,
            subjectDid: c.subjectDid,
            issuerDid: c.issuerDid,
            status: c.status,
            issuedAt: c.issuedAt,
            expiresAt: c.expiresAt,
        }));
    }
};
exports.IssuerService = IssuerService;
exports.IssuerService = IssuerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        did_service_1.DidService,
        sd_jwt_service_1.SdJwtService,
        config_1.ConfigService])
], IssuerService);
//# sourceMappingURL=issuer.service.js.map