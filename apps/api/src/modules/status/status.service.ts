import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { BitstringStatusListService } from './bitstring-status-list.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class StatusService {
  private readonly logger = new Logger(StatusService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly bitstringService: BitstringStatusListService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async getOrCreateStatusList(issuerDid: string, purpose: string = 'revocation') {
    let statusList = await this.db.statusList.findOne({ issuerDid, purpose }).lean();

    if (!statusList) {
      const size = this.configService.get<number>('credential.statusListSize') || 131072;
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

    return { ...statusList, id: statusList._id.toString() };
  }

  async allocateIndex(issuerDid: string): Promise<{ statusListId: string; index: number }> {
    const statusList = await this.getOrCreateStatusList(issuerDid);

    if (statusList.currentIndex >= statusList.size) {
      throw new Error('Status list is full');
    }

    const index = statusList.currentIndex;

    await this.db.statusList.updateOne(
      { _id: statusList._id },
      { $set: { currentIndex: index + 1 } },
    );

    return { statusListId: statusList.id, index };
  }

  async revokeCredential(credentialId: string, reason?: string) {
    const credential = await this.db.issuedCredential.findById(credentialId).lean();

    if (!credential) {
      throw new NotFoundException(`Credential not found: ${credentialId}`);
    }

    if (credential.statusListId && credential.statusListIndex !== null) {
      const statusList = await this.db.statusList.findById(credential.statusListId).lean();

      if (statusList) {
        const updatedList = this.bitstringService.setBit(
          statusList.encodedList,
          credential.statusListIndex!,
          true,
        );

        await this.db.statusList.updateOne(
          { _id: statusList._id },
          { $set: { encodedList: updatedList } },
        );
      }
    }

    await this.db.issuedCredential.updateOne(
      { _id: credentialId },
      { $set: { status: 'revoked' } },
    );

    this.notifyRevocation(credential.subjectDid, credential.schemaTypeUri, reason).catch(() => {});

    return { revoked: true, updatedAt: new Date() };
  }

  private async notifyRevocation(
    subjectDid: string,
    schemaTypeUri: string,
    reason?: string,
  ): Promise<void> {
    const walletDid = await this.db.walletDid.findOne({ did: subjectDid }).lean();
    if (!walletDid) return;

    const holder = await this.db.user.findById(walletDid.holderId).lean();
    if (!holder) return;

    const schema = await this.db.credentialSchema.findOne({ typeUri: schemaTypeUri }).lean();

    await this.mailService.sendCredentialRevoked(
      holder.email,
      holder.name,
      schema?.name || schemaTypeUri,
      reason || 'No reason provided',
    );
  }

  async suspendCredential(credentialId: string, reason?: string) {
    const credential = await this.db.issuedCredential.findById(credentialId).lean();

    if (!credential) {
      throw new NotFoundException(`Credential not found: ${credentialId}`);
    }

    await this.db.issuedCredential.updateOne(
      { _id: credentialId },
      { $set: { status: 'suspended' } },
    );

    return { suspended: true, updatedAt: new Date() };
  }

  async reinstateCredential(credentialId: string) {
    const credential = await this.db.issuedCredential.findById(credentialId).lean();

    if (!credential) {
      throw new NotFoundException(`Credential not found: ${credentialId}`);
    }

    if (credential.statusListId && credential.statusListIndex !== null) {
      const statusList = await this.db.statusList.findById(credential.statusListId).lean();

      if (statusList) {
        const updatedList = this.bitstringService.setBit(
          statusList.encodedList,
          credential.statusListIndex!,
          false,
        );

        await this.db.statusList.updateOne(
          { _id: statusList._id },
          { $set: { encodedList: updatedList } },
        );
      }
    }

    await this.db.issuedCredential.updateOne(
      { _id: credentialId },
      { $set: { status: 'active' } },
    );

    return { reinstated: true, updatedAt: new Date() };
  }

  async getStatusList(id: string) {
    const statusList = await this.db.statusList.findById(id).lean();
    if (!statusList) {
      throw new NotFoundException(`Status list not found: ${id}`);
    }

    return {
      '@context': ['https://www.w3.org/ns/credentials/v2'],
      id: `${this.configService.get<string>('apiBaseUrl') || 'http://localhost:8000'}/status/lists/${id}`,
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

  async checkStatus(statusListUri: string, index: number): Promise<boolean> {
    const parts = statusListUri.split('/');
    const listId = parts[parts.length - 1];

    const statusList = await this.db.statusList.findById(listId).lean();
    if (!statusList) {
      return false;
    }

    return !this.bitstringService.getBit(statusList.encodedList, index);
  }
}
