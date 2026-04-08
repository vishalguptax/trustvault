import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { BitstringStatusListService } from './bitstring-status-list.service';
import { MailService } from '../mail/mail.service';
export declare class StatusService {
    private readonly db;
    private readonly bitstringService;
    private readonly configService;
    private readonly mailService;
    private readonly logger;
    constructor(db: DatabaseService, bitstringService: BitstringStatusListService, configService: ConfigService, mailService: MailService);
    getOrCreateStatusList(issuerDid: string, purpose?: string): Promise<any>;
    allocateIndex(issuerDid: string): Promise<{
        statusListId: string;
        index: number;
    }>;
    revokeCredential(credentialId: string, reason?: string): Promise<{
        revoked: boolean;
        updatedAt: Date;
    }>;
    private notifyRevocation;
    suspendCredential(credentialId: string, reason?: string): Promise<{
        suspended: boolean;
        updatedAt: Date;
    }>;
    reinstateCredential(credentialId: string): Promise<{
        reinstated: boolean;
        updatedAt: Date;
    }>;
    getStatusList(id: string): Promise<{
        '@context': string[];
        id: string;
        type: string[];
        issuer: string;
        validFrom: string;
        credentialSubject: {
            type: string;
            statusPurpose: string;
            encodedList: string;
        };
    }>;
    checkStatus(statusListUri: string, index: number): Promise<boolean>;
}
//# sourceMappingURL=status.service.d.ts.map