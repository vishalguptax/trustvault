import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConsentService {
  constructor(private readonly prisma: PrismaService) {}

  async recordConsent(
    holderId: string,
    verifierDid: string,
    verifierName: string | undefined,
    credentialIds: string[],
    disclosedClaims: Record<string, string[]>,
    purpose?: string,
  ) {
    return this.prisma.consentRecord.create({
      data: {
        holderId,
        verifierDid,
        verifierName,
        credentialIds,
        disclosedClaims,
        purpose,
      },
    });
  }

  async getConsentHistory(holderId: string) {
    return this.prisma.consentRecord.findMany({
      where: { holderId },
      orderBy: { consentGivenAt: 'desc' },
    });
  }
}
