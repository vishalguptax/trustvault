import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import mongoose, { Connection, Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';

import { UserSchema, type UserDocument } from './schemas/user.schema';
import { DidSchema, type DidDocument } from './schemas/did.schema';
import { CredentialSchemaSchema, type CredentialSchemaDocument } from './schemas/credential-schema.schema';
import { CredentialOfferSchema, type CredentialOfferDocument } from './schemas/credential-offer.schema';
import { IssuedCredentialSchema, type IssuedCredentialDocument } from './schemas/issued-credential.schema';
import { StatusListSchema, type StatusListDocument } from './schemas/status-list.schema';
import { TrustedIssuerSchema, type TrustedIssuerDocument } from './schemas/trusted-issuer.schema';
import { TrustPolicySchema, type TrustPolicyDocument } from './schemas/trust-policy.schema';
import { WalletCredentialSchema, type WalletCredentialDocument } from './schemas/wallet-credential.schema';
import { WalletDidSchema, type WalletDidDocument } from './schemas/wallet-did.schema';
import { ConsentRecordSchema, type ConsentRecordDocument } from './schemas/consent-record.schema';
import { VerificationRequestSchema, type VerificationRequestDocument } from './schemas/verification-request.schema';
import { VerifierPolicySchema, type VerifierPolicyDocument } from './schemas/verifier-policy.schema';
import { AuditLogSchema, type AuditLogDocument } from './schemas/audit-log.schema';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private connection: Connection | null = null;

  // Models
  readonly user: Model<UserDocument>;
  readonly did: Model<DidDocument>;
  readonly credentialSchema: Model<CredentialSchemaDocument>;
  readonly credentialOffer: Model<CredentialOfferDocument>;
  readonly issuedCredential: Model<IssuedCredentialDocument>;
  readonly statusList: Model<StatusListDocument>;
  readonly trustedIssuer: Model<TrustedIssuerDocument>;
  readonly trustPolicy: Model<TrustPolicyDocument>;
  readonly walletCredential: Model<WalletCredentialDocument>;
  readonly walletDid: Model<WalletDidDocument>;
  readonly consentRecord: Model<ConsentRecordDocument>;
  readonly verificationRequest: Model<VerificationRequestDocument>;
  readonly verifierPolicy: Model<VerifierPolicyDocument>;
  readonly auditLog: Model<AuditLogDocument>;

  constructor(private readonly configService: ConfigService) {
    const conn = mongoose.connection;

    this.user = conn.model<UserDocument>('User', UserSchema);
    this.did = conn.model<DidDocument>('Did', DidSchema);
    this.credentialSchema = conn.model<CredentialSchemaDocument>('CredentialSchema', CredentialSchemaSchema);
    this.credentialOffer = conn.model<CredentialOfferDocument>('CredentialOffer', CredentialOfferSchema);
    this.issuedCredential = conn.model<IssuedCredentialDocument>('IssuedCredential', IssuedCredentialSchema);
    this.statusList = conn.model<StatusListDocument>('StatusList', StatusListSchema);
    this.trustedIssuer = conn.model<TrustedIssuerDocument>('TrustedIssuer', TrustedIssuerSchema);
    this.trustPolicy = conn.model<TrustPolicyDocument>('TrustPolicy', TrustPolicySchema);
    this.walletCredential = conn.model<WalletCredentialDocument>('WalletCredential', WalletCredentialSchema);
    this.walletDid = conn.model<WalletDidDocument>('WalletDid', WalletDidSchema);
    this.consentRecord = conn.model<ConsentRecordDocument>('ConsentRecord', ConsentRecordSchema);
    this.verificationRequest = conn.model<VerificationRequestDocument>('VerificationRequest', VerificationRequestSchema);
    this.verifierPolicy = conn.model<VerifierPolicyDocument>('VerifierPolicy', VerifierPolicySchema);
    this.auditLog = conn.model<AuditLogDocument>('AuditLog', AuditLogSchema);
  }

  async connect(): Promise<void> {
    try {
      const uri = this.configService.get<string>('database.url');
      if (!uri) {
        throw new Error('DATABASE_URL is not set');
      }
      await mongoose.connect(uri);
      this.connection = mongoose.connection;
      this.logger.log('MongoDB connected');
    } catch (error) {
      this.connection = null;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`MongoDB connection failed: ${msg}`);
    }
  }

  isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.isConnected()) return false;
      await mongoose.connection.db!.admin().ping();
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await mongoose.disconnect();
    this.logger.log('MongoDB disconnected');
  }
}
