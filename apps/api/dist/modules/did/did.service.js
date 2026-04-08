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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DidService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const did_key_provider_1 = require("./providers/did-key.provider");
let DidService = class DidService {
    db;
    didKeyProvider;
    constructor(db, didKeyProvider) {
        this.db = db;
        this.didKeyProvider = didKeyProvider;
    }
    async createDid(method = 'key') {
        if (method !== 'key') {
            throw new Error(`Unsupported DID method: ${method}. Only "key" is supported in prototype.`);
        }
        const keyPair = await this.didKeyProvider.generateKeyPair();
        const { did, document } = await this.didKeyProvider.createDid(keyPair);
        await this.db.did.create({
            did,
            method,
            document: JSON.parse(JSON.stringify(document)),
            keys: [
                {
                    kid: keyPair.kid,
                    type: keyPair.algorithm,
                    publicKeyJwk: JSON.parse(JSON.stringify(keyPair.publicKey)),
                    privateKeyJwk: JSON.parse(JSON.stringify(keyPair.privateKey)),
                    purposes: ['authentication', 'assertionMethod'],
                },
            ],
            active: true,
        });
        return { did, method, document, keyPair };
    }
    async resolveDid(did) {
        const record = await this.db.did.findOne({ did }).lean();
        if (!record) {
            throw new common_1.NotFoundException(`DID not found: ${did}`);
        }
        return record.document;
    }
    async getKeyPair(did) {
        const record = await this.db.did.findOne({ did }).lean();
        if (!record) {
            throw new common_1.NotFoundException(`DID not found: ${did}`);
        }
        const key = record.keys[0];
        if (!key) {
            throw new common_1.NotFoundException(`No keys found for DID: ${did}`);
        }
        return {
            publicKey: key.publicKeyJwk,
            privateKey: key.privateKeyJwk,
            kid: key.kid,
            algorithm: key.type,
        };
    }
    async getPublicKey(did) {
        const document = await this.resolveDid(did);
        const publicKey = this.didKeyProvider.extractPublicKeyFromDocument(document);
        if (!publicKey) {
            throw new common_1.NotFoundException(`No public key found for DID: ${did}`);
        }
        return publicKey;
    }
    async listDids() {
        const records = await this.db.did.find({}).select('did method active createdAt').lean();
        return records.map((r) => ({
            did: r.did,
            method: r.method,
            active: r.active,
            createdAt: r.createdAt,
        }));
    }
};
exports.DidService = DidService;
exports.DidService = DidService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        did_key_provider_1.DidKeyProvider])
], DidService);
//# sourceMappingURL=did.service.js.map