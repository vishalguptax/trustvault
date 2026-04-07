import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

function withId<T extends { _id: any }>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc as any;
  return { ...rest, id: _id.toString() };
}

@Injectable()
export class TrustService {
  constructor(private readonly db: DatabaseService) {}

  async registerIssuer(
    did: string,
    name: string,
    credentialTypes: string[],
    description?: string,
  ) {
    const existing = await this.db.trustedIssuer.findOne({ did }).lean();
    if (existing) {
      throw new ConflictException(`Issuer already registered: ${did}`);
    }

    const created = await this.db.trustedIssuer.create({
      did, name, credentialTypes, description, status: 'active',
    });
    return withId(created.toObject());
  }

  async listIssuers() {
    const records = await this.db.trustedIssuer.find({}).sort({ createdAt: -1 }).lean();
    return records.map((r) => withId(r));
  }

  async getIssuer(did: string) {
    const issuer = await this.db.trustedIssuer.findOne({ did }).lean();
    if (!issuer) {
      return { trusted: false, issuer: null };
    }
    return { trusted: issuer.status === 'active', issuer: withId(issuer) };
  }

  async updateIssuer(
    did: string,
    updates: { name?: string; credentialTypes?: string[]; status?: string },
  ) {
    const issuer = await this.db.trustedIssuer.findOne({ did }).lean();
    if (!issuer) {
      throw new NotFoundException(`Issuer not found: ${did}`);
    }

    await this.db.trustedIssuer.updateOne({ did }, { $set: updates });

    return { updated: true };
  }

  async removeIssuer(did: string) {
    const issuer = await this.db.trustedIssuer.findOne({ did }).lean();
    if (!issuer) {
      throw new NotFoundException(`Issuer not found: ${did}`);
    }

    await this.db.trustedIssuer.deleteOne({ did });
    return { removed: true };
  }

  /** Link a user account to a trusted issuer entry */
  async linkUserToIssuer(email: string, trustedIssuerId: string) {
    await this.db.user.updateOne({ email }, { $set: { trustedIssuerId } });
  }

  /** Get the trusted issuer entry for a user by their trustedIssuerId */
  async getIssuerForUser(trustedIssuerId: string) {
    const result = await this.db.trustedIssuer.findById(trustedIssuerId).lean();
    return result ? withId(result) : null;
  }

  async verifyTrust(issuerDid: string, credentialType: string): Promise<{ trusted: boolean; reason?: string }> {
    const issuer = await this.db.trustedIssuer.findOne({ did: issuerDid }).lean();

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
