import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

function withId<T extends { _id: any }>(doc: T): T & { id: string } {
  const plain = doc as any;
  plain.id = plain._id.toString();
  return plain;
}

@Injectable()
export class ConsentService {
  constructor(private readonly db: DatabaseService) {}

  async recordConsent(
    holderId: string,
    verifierDid: string,
    verifierName: string | undefined,
    credentialIds: string[],
    disclosedClaims: Record<string, string[]>,
    purpose?: string,
  ) {
    const created = await this.db.consentRecord.create({
      holderId,
      verifierDid,
      verifierName,
      credentialIds,
      disclosedClaims,
      purpose,
    });
    return withId(created.toObject());
  }

  async getConsentHistory(holderId: string) {
    const records = await this.db.consentRecord
      .find({ holderId })
      .sort({ consentGivenAt: -1 })
      .lean();
    return records.map((r) => withId(r));
  }
}
