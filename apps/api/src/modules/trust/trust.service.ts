import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async registerIssuer(
    did: string,
    name: string,
    credentialTypes: string[],
    description?: string,
  ) {
    const existing = await this.prisma.trustedIssuer.findUnique({ where: { did } });
    if (existing) {
      throw new ConflictException(`Issuer already registered: ${did}`);
    }

    return this.prisma.trustedIssuer.create({
      data: { did, name, credentialTypes, description, status: 'active' },
    });
  }

  async listIssuers() {
    return this.prisma.trustedIssuer.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getIssuer(did: string) {
    const issuer = await this.prisma.trustedIssuer.findUnique({ where: { did } });
    if (!issuer) {
      return { trusted: false, issuer: null };
    }
    return { trusted: issuer.status === 'active', issuer };
  }

  async updateIssuer(
    did: string,
    updates: { name?: string; credentialTypes?: string[]; status?: string },
  ) {
    const issuer = await this.prisma.trustedIssuer.findUnique({ where: { did } });
    if (!issuer) {
      throw new NotFoundException(`Issuer not found: ${did}`);
    }

    await this.prisma.trustedIssuer.update({
      where: { did },
      data: updates,
    });

    return { updated: true };
  }

  async removeIssuer(did: string) {
    const issuer = await this.prisma.trustedIssuer.findUnique({ where: { did } });
    if (!issuer) {
      throw new NotFoundException(`Issuer not found: ${did}`);
    }

    await this.prisma.trustedIssuer.delete({ where: { did } });
    return { removed: true };
  }

  async verifyTrust(issuerDid: string, credentialType: string): Promise<{ trusted: boolean; reason?: string }> {
    const issuer = await this.prisma.trustedIssuer.findUnique({ where: { did: issuerDid } });

    if (!issuer) {
      return { trusted: false, reason: 'Issuer not found in trust registry' };
    }

    if (issuer.status !== 'active') {
      return { trusted: false, reason: `Issuer status is ${issuer.status}` };
    }

    if (!issuer.credentialTypes.includes(credentialType)) {
      return {
        trusted: false,
        reason: `Issuer not authorized to issue ${credentialType}`,
      };
    }

    return { trusted: true };
  }
}
