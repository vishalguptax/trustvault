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
exports.SdJwtService = void 0;
const common_1 = require("@nestjs/common");
const sd_jwt_vc_1 = require("@sd-jwt/sd-jwt-vc");
const jose = __importStar(require("jose"));
const crypto_1 = require("crypto");
const constants_1 = require("../../common/constants");
const key_manager_service_1 = require("./key-manager.service");
const hasher = (data, alg) => {
    const algorithm = alg === 'sha-256' ? 'sha256' : alg;
    const hash = (0, crypto_1.createHash)(algorithm).update(data).digest();
    return new Uint8Array(hash);
};
const saltGenerator = () => {
    return (0, crypto_1.randomBytes)(16).toString('base64url');
};
let SdJwtService = class SdJwtService {
    keyManager;
    constructor(keyManager) {
        this.keyManager = keyManager;
    }
    createSigner(privateKeyJwk) {
        return async (data) => {
            const key = await this.keyManager.importPrivateKey(privateKeyJwk);
            const parts = data.split('.');
            if (parts.length !== 2) {
                throw new Error('Invalid data format for signing');
            }
            const payload = Buffer.from(parts[1], 'base64url');
            const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
            const jws = await new jose.CompactSign(payload)
                .setProtectedHeader(header)
                .sign(key);
            return jws.split('.')[2];
        };
    }
    createVerifier(publicKeyJwk) {
        return async (data, signature) => {
            try {
                const key = await this.keyManager.importPublicKey(publicKeyJwk);
                await jose.compactVerify(`${data}.${signature}`, key);
                return true;
            }
            catch {
                return false;
            }
        };
    }
    createInstance(privateKeyJwk, publicKeyJwk, kbPrivateKeyJwk, kbPublicKeyJwk) {
        const signer = privateKeyJwk ? this.createSigner(privateKeyJwk) : undefined;
        const verifier = publicKeyJwk ? this.createVerifier(publicKeyJwk) : undefined;
        const kbSigner = kbPrivateKeyJwk ? this.createSigner(kbPrivateKeyJwk) : undefined;
        const kbVerifier = kbPublicKeyJwk
            ? async (data, signature) => {
                try {
                    const key = await this.keyManager.importPublicKey(kbPublicKeyJwk);
                    await jose.compactVerify(`${data}.${signature}`, key);
                    return true;
                }
                catch {
                    return false;
                }
            }
            : undefined;
        return new sd_jwt_vc_1.SDJwtVcInstance({
            hasher,
            hashAlg: 'sha-256',
            saltGenerator,
            signAlg: constants_1.SIGNING_ALGORITHM,
            signer,
            verifier,
            kbSigner,
            kbSignAlg: kbPrivateKeyJwk ? constants_1.SIGNING_ALGORITHM : undefined,
            kbVerifier,
        });
    }
    async issue(options) {
        const instance = this.createInstance(options.issuerPrivateKey);
        const payload = {
            iss: options.issuerDid,
            sub: options.subjectDid,
            vct: options.credentialType,
            iat: Math.floor(Date.now() / 1000),
            ...options.claims,
        };
        if (options.expiresAt) {
            payload.exp = Math.floor(options.expiresAt.getTime() / 1000);
        }
        if (options.holderPublicKey) {
            payload.cnf = { jwk: options.holderPublicKey };
        }
        if (options.statusListUri && options.statusListIndex !== undefined) {
            payload.status = {
                status_list: {
                    idx: options.statusListIndex,
                    uri: options.statusListUri,
                },
            };
        }
        const disclosureFrame = {
            _sd: options.disclosableClaims,
        };
        const sdJwtVc = await instance.issue(payload, disclosureFrame);
        return sdJwtVc;
    }
    async verify(sdJwtVc, issuerPublicKey, requiredClaims) {
        try {
            const instance = this.createInstance(undefined, issuerPublicKey);
            const result = await instance.verify(sdJwtVc, requiredClaims);
            return {
                valid: true,
                payload: result.payload,
                disclosedClaims: result.payload,
            };
        }
        catch (error) {
            return {
                valid: false,
                payload: {},
                disclosedClaims: {},
                error: error instanceof Error ? error.message : 'Verification failed',
            };
        }
    }
    async present(options) {
        const instance = this.createInstance(undefined, undefined, options.holderPrivateKey);
        const presentationFrame = {};
        for (const claim of options.disclosedClaims) {
            presentationFrame[claim] = true;
        }
        const presented = await instance.present(options.sdJwtVc, presentationFrame, {
            kb: {
                payload: {
                    aud: options.audience,
                    nonce: options.nonce,
                    iat: Math.floor(Date.now() / 1000),
                },
            },
        });
        return presented;
    }
    decode(sdJwtVc) {
        const parts = sdJwtVc.split('~');
        const jwt = parts[0];
        const disclosures = parts.slice(1).filter((d) => d.length > 0);
        const [headerB64, payloadB64] = jwt.split('.');
        const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
        return { header, payload, disclosures };
    }
};
exports.SdJwtService = SdJwtService;
exports.SdJwtService = SdJwtService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [key_manager_service_1.KeyManagerService])
], SdJwtService);
//# sourceMappingURL=sd-jwt.service.js.map