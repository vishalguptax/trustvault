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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const did_service_1 = require("../did/did.service");
const sd_jwt_service_1 = require("../crypto/sd-jwt.service");
const oid4vci_client_service_1 = require("./oid4vci-client.service");
const consent_service_1 = require("./consent.service");
const verifier_service_1 = require("../verifier/verifier.service");
const mail_service_1 = require("../mail/mail.service");
let WalletService = class WalletService {
    db;
    didService;
    sdJwtService;
    oid4vciClient;
    consentService;
    verifierService;
    mailService;
    constructor(db, didService, sdJwtService, oid4vciClient, consentService, verifierService, mailService) {
        this.db = db;
        this.didService = didService;
        this.sdJwtService = sdJwtService;
        this.oid4vciClient = oid4vciClient;
        this.consentService = consentService;
        this.verifierService = verifierService;
        this.mailService = mailService;
    }
    async createHolderDid(holderId, method = 'key') {
        const result = await this.didService.createDid(method);
        const walletDid = await this.db.walletDid.create({
            holderId,
            did: result.did,
            method,
            keyData: JSON.parse(JSON.stringify(result.keyPair)),
            isPrimary: true,
        });
        return { did: walletDid.did, method: walletDid.method, createdAt: walletDid.createdAt };
    }
    async getOrCreateHolderDid(holderId) {
        let walletDid = await this.db.walletDid.findOne({ holderId, isPrimary: true }).lean();
        if (!walletDid) {
            const result = await this.didService.createDid('key');
            const created = await this.db.walletDid.create({
                holderId,
                did: result.did,
                method: 'key',
                keyData: JSON.parse(JSON.stringify(result.keyPair)),
                isPrimary: true,
            });
            walletDid = created.toObject();
        }
        const keyData = walletDid.keyData;
        return { did: walletDid.did, keyPair: keyData };
    }
    async receiveCredential(credentialOfferUri, holderId) {
        const offer = this.oid4vciClient.parseOfferUri(credentialOfferUri);
        const preAuthCode = offer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code']['pre-authorized_code'];
        const credentialType = offer.credential_configuration_ids[0];
        const tokenEndpoint = `${offer.credential_issuer}/token`;
        const tokenResponse = await this.oid4vciClient.exchangeCodeForToken(tokenEndpoint, preAuthCode);
        const holder = await this.getOrCreateHolderDid(holderId);
        const proofJwt = await this.oid4vciClient.createHolderProof(holder.did, holder.keyPair.privateKey, tokenResponse.c_nonce, offer.credential_issuer);
        const credentialEndpoint = `${offer.credential_issuer}/credential`;
        const credentialResponse = await this.oid4vciClient.requestCredential(credentialEndpoint, tokenResponse.access_token, 'vc+sd-jwt', credentialType, proofJwt);
        const decoded = this.sdJwtService.decode(credentialResponse.credential);
        const payload = decoded.payload;
        // Decode disclosures to extract actual selective disclosure claim values
        const sdClaimNames = [];
        const disclosedValues = {};
        for (const d of decoded.disclosures) {
            try {
                const parsed = JSON.parse(Buffer.from(d, 'base64url').toString());
                const claimName = parsed[1];
                const claimValue = parsed[2];
                sdClaimNames.push(claimName);
                if (claimValue !== undefined) {
                    disclosedValues[claimName] = claimValue;
                }
            }
            catch {
                sdClaimNames.push(d);
            }
        }
        // Merge payload with decoded disclosure values so all claims are stored
        const claims = { ...payload, ...disclosedValues };
        const issuedAt = payload.iat ? new Date(payload.iat * 1000) : new Date();
        const expiresAt = payload.exp ? new Date(payload.exp * 1000) : undefined;
        const walletCred = await this.db.walletCredential.create({
            holderId,
            rawCredential: credentialResponse.credential,
            format: 'sd-jwt-vc',
            credentialType,
            issuerDid: payload.iss,
            claims: JSON.parse(JSON.stringify(claims)),
            sdClaims: sdClaimNames,
            issuedAt,
            expiresAt,
        });
        const schema = await this.db.credentialSchema.findOne({ typeUri: credentialType }).lean();
        const trustedIssuer = await this.db.trustedIssuer.findOne({ did: payload.iss }).lean();
        const typeName = schema?.name || credentialType;
        const issuerName = trustedIssuer?.name || payload.iss;
        const holderUser = await this.db.user.findById(holderId).lean();
        if (holderUser) {
            this.mailService
                .sendCredentialIssued(holderUser.email, holderUser.name, typeName, issuerName)
                .catch(() => { });
        }
        return {
            credentialId: walletCred._id.toString(),
            type: credentialType,
            typeName,
            issuerDid: payload.iss,
            issuerName: trustedIssuer?.name || null,
            subjectDid: payload.sub || null,
            claims,
            sdClaims: walletCred.sdClaims,
            rawCredential: walletCred.rawCredential,
            status: 'active',
            issuedAt,
            expiresAt: expiresAt || null,
        };
    }
    async listCredentials(holderId) {
        const credentials = await this.db.walletCredential.find({ holderId }).sort({ createdAt: -1 }).lean();
        const schemas = await this.db.credentialSchema.find({ active: true }).lean();
        const schemaMap = new Map(schemas.map((s) => [s.typeUri, s.name]));
        const issuerDids = [...new Set(credentials.map((c) => c.issuerDid))];
        const trustedIssuers = await this.db.trustedIssuer.find({ did: { $in: issuerDids } }).lean();
        const issuerMap = new Map(trustedIssuers.map((i) => [i.did, i.name]));
        const enriched = credentials.map((c) => {
            const { _id, ...crest } = c;
            const storedClaims = c.claims || {};
            return {
                ...crest,
                id: _id.toString(),
                subjectDid: storedClaims.sub || '',
                typeName: schemaMap.get(c.credentialType) || c.credentialType,
                issuerName: issuerMap.get(c.issuerDid) || null,
            };
        });
        return { credentials: enriched, total: enriched.length };
    }
    async getCredential(id) {
        const credential = await this.db.walletCredential.findById(id).lean();
        if (!credential) {
            throw new common_1.NotFoundException(`Credential not found: ${id}`);
        }
        const { _id, ...rest } = credential;
        return { ...rest, id: _id.toString() };
    }
    async getCredentialClaims(id) {
        const credential = await this.getCredential(id);
        const decoded = this.sdJwtService.decode(credential.rawCredential);
        const payloadClaims = decoded.payload;
        const claims = {};
        for (const [key, value] of Object.entries(payloadClaims)) {
            if (!key.startsWith('_') && !['iss', 'sub', 'iat', 'exp', 'vct', 'cnf', 'status'].includes(key)) {
                claims[key] = value;
            }
        }
        for (const disclosure of decoded.disclosures) {
            try {
                const parsed = JSON.parse(Buffer.from(disclosure, 'base64url').toString());
                const claimKey = parsed[1];
                const claimValue = parsed[2];
                if (claimKey && claimValue !== undefined) {
                    claims[claimKey] = claimValue;
                }
            }
            catch {
            }
        }
        const disclosed = Object.entries(claims).map(([key, value]) => ({
            key,
            value,
            selectable: credential.sdClaims.includes(key),
        }));
        return {
            fixedClaims: disclosed.filter((c) => !c.selectable),
            selectiveClaims: disclosed.filter((c) => c.selectable),
        };
    }
    async deleteCredential(id) {
        await this.getCredential(id);
        await this.db.walletCredential.deleteOne({ _id: id });
        return { deleted: true };
    }
    async createPresentation(verificationRequestId, holderId, selectedCredentials, disclosedClaims, consent) {
        if (!consent) {
            throw new common_1.BadRequestException('Consent is required to create a presentation');
        }
        const verificationRequest = await this.db.verificationRequest.findById(verificationRequestId).lean();
        if (!verificationRequest) {
            throw new common_1.NotFoundException(`Verification request not found: ${verificationRequestId}`);
        }
        const holder = await this.getOrCreateHolderDid(holderId);
        const vpTokenParts = [];
        for (const credId of selectedCredentials) {
            const walletCred = await this.getCredential(credId);
            const claimsToDisclose = disclosedClaims[credId] || [];
            const presented = await this.sdJwtService.present({
                sdJwtVc: walletCred.rawCredential,
                disclosedClaims: claimsToDisclose,
                nonce: verificationRequest.nonce,
                audience: verificationRequest.verifierDid,
                holderPrivateKey: holder.keyPair.privateKey,
            });
            vpTokenParts.push(presented);
        }
        const vpToken = vpTokenParts.length === 1 ? vpTokenParts[0] : JSON.stringify(vpTokenParts);
        await this.consentService.recordConsent(holderId, verificationRequest.verifierDid, undefined, selectedCredentials, disclosedClaims, 'verification');
        const verificationResult = await this.verifierService.handlePresentationResponse(vpToken, verificationRequest.state);
        return {
            presentationId: verificationRequestId,
            vpToken,
            verificationId: verificationResult.verificationId,
            result: verificationResult.status,
            checks: verificationResult.result,
        };
    }
    async getConsentHistory(holderId) {
        return this.consentService.getConsentHistory(holderId);
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, common_1.Inject)((0, common_1.forwardRef)(() => verifier_service_1.VerifierService))),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        did_service_1.DidService,
        sd_jwt_service_1.SdJwtService,
        oid4vci_client_service_1.Oid4vciClientService,
        consent_service_1.ConsentService,
        verifier_service_1.VerifierService,
        mail_service_1.MailService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map