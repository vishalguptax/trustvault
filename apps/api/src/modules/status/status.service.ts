import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { BitstringStatusListService } from './bitstring-status-list.service';

@Injectable()
export class StatusService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bitstringService: BitstringStatusListService,
    private readonly configService: ConfigService,
  ) {}

  async getOrCreateStatusList(issuerDid: string, purpose: string = 'revocation') {
    let statusList = await this.prisma.statusList.findFirst({
      where: { issuerDid, purpose },
    });

    if (!statusList) {
      const size = this.configService.get<number>('credential.statusListSize') || 131072;
      const encodedList = this.bitstringService.createEmptyList(size);

      statusList = await this.prisma.statusList.create({
        data: {
          issuerDid,
          purpose,
          encodedList,
          currentIndex: 0,
          size,
        },
      });
    }

    return statusList;
  }

  async allocateIndex(issuerDid: string): Promise<{ statusListId: string; index: number }> {
    const statusList = await this.getOrCreateStatusList(issuerDid);

    if (statusList.currentIndex >= statusList.size) {
      throw new Error('Status list is full');
    }

    const index = statusList.currentIndex;

    await this.prisma.statusList.update({
      where: { id: statusList.id },
      data: { currentIndex: index + 1 },
    });

    return { statusListId: statusList.id, index };
  }

  async revokeCredential(credentialId: string, reason?: string) {
    const credential = await this.prisma.issuedCredential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new NotFoundException(`Credential not found: ${credentialId}`);
    }

    if (credential.statusListId && credential.statusListIndex !== null) {
      const statusList = await this.prisma.statusList.findUnique({
        where: { id: credential.statusListId },
      });

      if (statusList) {
        const updatedList = this.bitstringService.setBit(
          statusList.encodedList,
          credential.statusListIndex!,
          true,
        );

        await this.prisma.statusList.update({
          where: { id: statusList.id },
          data: { encodedList: updatedList },
        });
      }
    }

    await this.prisma.issuedCredential.update({
      where: { id: credentialId },
      data: { status: 'revoked' },
    });

    return { revoked: true, updatedAt: new Date() };
  }

  async suspendCredential(credentialId: string, reason?: string) {
    const credential = await this.prisma.issuedCredential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new NotFoundException(`Credential not found: ${credentialId}`);
    }

    await this.prisma.issuedCredential.update({
      where: { id: credentialId },
      data: { status: 'suspended' },
    });

    return { suspended: true, updatedAt: new Date() };
  }

  async reinstateCredential(credentialId: string) {
    const credential = await this.prisma.issuedCredential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new NotFoundException(`Credential not found: ${credentialId}`);
    }

    if (credential.statusListId && credential.statusListIndex !== null) {
      const statusList = await this.prisma.statusList.findUnique({
        where: { id: credential.statusListId },
      });

      if (statusList) {
        const updatedList = this.bitstringService.setBit(
          statusList.encodedList,
          credential.statusListIndex!,
          false,
        );

        await this.prisma.statusList.update({
          where: { id: statusList.id },
          data: { encodedList: updatedList },
        });
      }
    }

    await this.prisma.issuedCredential.update({
      where: { id: credentialId },
      data: { status: 'active' },
    });

    return { reinstated: true, updatedAt: new Date() };
  }

  async getStatusList(id: string) {
    const statusList = await this.prisma.statusList.findUnique({ where: { id } });
    if (!statusList) {
      throw new NotFoundException(`Status list not found: ${id}`);
    }

    return {
      '@context': ['https://www.w3.org/ns/credentials/v2'],
      id: `${this.configService.get<string>('issuer.baseUrl') || 'http://localhost:3000'}/status/lists/${id}`,
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

    const statusList = await this.prisma.statusList.findUnique({ where: { id: listId } });
    if (!statusList) {
      return false;
    }

    return !this.bitstringService.getBit(statusList.encodedList, index);
  }
}
