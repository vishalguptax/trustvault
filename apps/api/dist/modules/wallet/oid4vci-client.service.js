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
exports.Oid4vciClientService = void 0;
const common_1 = require("@nestjs/common");
const jose = __importStar(require("jose"));
const did_service_1 = require("../did/did.service");
const key_manager_service_1 = require("../crypto/key-manager.service");
const constants_1 = require("../../common/constants");
let Oid4vciClientService = class Oid4vciClientService {
    didService;
    keyManager;
    constructor(didService, keyManager) {
        this.didService = didService;
        this.keyManager = keyManager;
    }
    parseOfferUri(credentialOfferUri) {
        try {
            const url = new URL(credentialOfferUri);
            const offerParam = url.searchParams.get('credential_offer');
            if (!offerParam) {
                throw new Error('Missing credential_offer parameter');
            }
            return JSON.parse(offerParam);
        }
        catch (error) {
            throw new common_1.BadRequestException(`Invalid credential offer URI: ${error instanceof Error ? error.message : 'unknown error'}`);
        }
    }
    /**
     * Unwrap the global response interceptor's { data: ... } wrapper.
     * Internal API calls hit the same server, so responses arrive wrapped.
     */
    unwrap(json) {
        if (json && typeof json === 'object' && 'data' in json) {
            return json.data;
        }
        return json;
    }
    async exchangeCodeForToken(tokenEndpoint, preAuthorizedCode, pin) {
        const body = {
            grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
            'pre-authorized_code': preAuthorizedCode,
        };
        if (pin) {
            body.pin = pin;
        }
        const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new common_1.BadRequestException(`Token exchange failed: ${error}`);
        }
        const json = await response.json();
        return this.unwrap(json);
    }
    async createHolderProof(holderDid, holderPrivateKey, cNonce, audience) {
        const key = await this.keyManager.importPrivateKey(holderPrivateKey);
        const publicJwk = { ...holderPrivateKey };
        delete publicJwk.d;
        const jwt = await new jose.SignJWT({
            nonce: cNonce,
        })
            .setProtectedHeader({
            alg: constants_1.SIGNING_ALGORITHM,
            typ: 'openid4vci-proof+jwt',
            jwk: publicJwk,
        })
            .setIssuer(holderDid)
            .setAudience(audience)
            .setIssuedAt()
            .sign(key);
        return jwt;
    }
    async requestCredential(credentialEndpoint, accessToken, format, credentialType, proofJwt) {
        const body = {
            format,
            credential_definition: { type: [credentialType] },
        };
        if (proofJwt) {
            body.proof = { proof_type: 'jwt', jwt: proofJwt };
        }
        const response = await fetch(credentialEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const error = await response.text();
            throw new common_1.BadRequestException(`Credential request failed: ${error}`);
        }
        const json = await response.json();
        return this.unwrap(json);
    }
};
exports.Oid4vciClientService = Oid4vciClientService;
exports.Oid4vciClientService = Oid4vciClientService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [did_service_1.DidService,
        key_manager_service_1.KeyManagerService])
], Oid4vciClientService);
//# sourceMappingURL=oid4vci-client.service.js.map