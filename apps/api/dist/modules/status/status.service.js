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
var StatusService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_service_1 = require("../../database/database.service");
const bitstring_status_list_service_1 = require("./bitstring-status-list.service");
const mail_service_1 = require("../mail/mail.service");
let StatusService = StatusService_1 = class StatusService {
    db;
    bitstringService;
    configService;
    mailService;
    logger = new common_1.Logger(StatusService_1.name);
    constructor(db, bitstringService, configService, mailService) {
        this.db = db;
        this.bitstringService = bitstringService;
        this.configService = configService;
        this.mailService = mailService;
    }
    async getOrCreateStatusList(issuerDid, purpose = 'revocation') {
        let statusList = await this.db.statusList.findOne({ issuerDid, purpose }).lean();
        if (!statusList) {
            const size = this.configService.get('credential.statusListSize') || 131072;
            const encodedList = this.bitstringService.createEmptyList(size);
            const created = await this.db.statusList.create({
                issuerDid,
                purpose,
                encodedList,
                currentIndex: 0,
                size,
            });
            statusList = created.toObject();
        }
        const { _id, ...rest } = statusList;
        return { ...rest, id: _id.toString() };
    }
    async allocateIndex(issuerDid) {
        const statusList = await this.getOrCreateStatusList(issuerDid);
        if (statusList.currentIndex >= statusList.size) {
            throw new Error('Status list is full');
        }
        const index = statusList.currentIndex;
        await this.db.statusList.updateOne({ _id: statusList._id }, { $set: { currentIndex: index + 1 } });
        return { statusListId: statusList.id, index };
    }
    async revokeCredential(credentialId, reason) {
        const credential = await this.db.issuedCredential.findById(credentialId).lean();
        if (!credential) {
            throw new common_1.NotFoundException(`Credential not found: ${credentialId}`);
        }
        if (credential.statusListId && credential.statusListIndex !== null) {
            const statusList = await this.db.statusList.findById(credential.statusListId).lean();
            if (statusList) {
                const updatedList = this.bitstringService.setBit(statusList.encodedList, credential.statusListIndex, true);
                await this.db.statusList.updateOne({ _id: statusList._id }, { $set: { encodedList: updatedList } });
            }
        }
        await this.db.issuedCredential.updateOne({ _id: credentialId }, { $set: { status: 'revoked' } });
        this.notifyRevocation(credential.subjectDid, credential.schemaTypeUri, reason).catch(() => { });
        return { revoked: true, updatedAt: new Date() };
    }
    async notifyRevocation(subjectDid, schemaTypeUri, reason) {
        const walletDid = await this.db.walletDid.findOne({ did: subjectDid }).lean();
        if (!walletDid)
            return;
        const holder = await this.db.user.findById(walletDid.holderId).lean();
        if (!holder)
            return;
        const schema = await this.db.credentialSchema.findOne({ typeUri: schemaTypeUri }).lean();
        await this.mailService.sendCredentialRevoked(holder.email, holder.name, schema?.name || schemaTypeUri, reason || 'No reason provided');
    }
    async suspendCredential(credentialId, reason) {
        const credential = await this.db.issuedCredential.findById(credentialId).lean();
        if (!credential) {
            throw new common_1.NotFoundException(`Credential not found: ${credentialId}`);
        }
        await this.db.issuedCredential.updateOne({ _id: credentialId }, { $set: { status: 'suspended' } });
        return { suspended: true, updatedAt: new Date() };
    }
    async reinstateCredential(credentialId) {
        const credential = await this.db.issuedCredential.findById(credentialId).lean();
        if (!credential) {
            throw new common_1.NotFoundException(`Credential not found: ${credentialId}`);
        }
        if (credential.statusListId && credential.statusListIndex !== null) {
            const statusList = await this.db.statusList.findById(credential.statusListId).lean();
            if (statusList) {
                const updatedList = this.bitstringService.setBit(statusList.encodedList, credential.statusListIndex, false);
                await this.db.statusList.updateOne({ _id: statusList._id }, { $set: { encodedList: updatedList } });
            }
        }
        await this.db.issuedCredential.updateOne({ _id: credentialId }, { $set: { status: 'active' } });
        return { reinstated: true, updatedAt: new Date() };
    }
    async getStatusList(id) {
        const statusList = await this.db.statusList.findById(id).lean();
        if (!statusList) {
            throw new common_1.NotFoundException(`Status list not found: ${id}`);
        }
        return {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            id: `${this.configService.get('apiBaseUrl') || 'http://localhost:8000'}/status/lists/${id}`,
            type: ['VerifiableCredential', 'BitstringStatusListCredential'],
            issuer: statusList.issuerDid,
            validFrom: statusList.createdAt.toISOString(),
            credentialSubject: {
                type: 'BitstringStatusList',
                statusPurpose: statusList.purpose,
                encodedList: statusList.encodedList,
            },
        };
    }
    async checkStatus(statusListUri, index) {
        const parts = statusListUri.split('/');
        const listId = parts[parts.length - 1];
        const statusList = await this.db.statusList.findById(listId).lean();
        if (!statusList) {
            return false;
        }
        return !this.bitstringService.getBit(statusList.encodedList, index);
    }
};
exports.StatusService = StatusService;
exports.StatusService = StatusService = StatusService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService,
        bitstring_status_list_service_1.BitstringStatusListService,
        config_1.ConfigService,
        mail_service_1.MailService])
], StatusService);
//# sourceMappingURL=status.service.js.map