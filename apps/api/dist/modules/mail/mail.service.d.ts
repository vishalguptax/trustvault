import { ConfigService } from '@nestjs/config';
export declare class MailService {
    private readonly configService;
    private readonly logger;
    private readonly resend;
    constructor(configService: ConfigService);
    private send;
    sendWelcome(to: string, name: string, role: string): Promise<void>;
    sendCredentialIssued(to: string, recipientName: string, credentialType: string, issuerName: string): Promise<void>;
    sendCredentialRevoked(to: string, recipientName: string, credentialType: string, reason: string): Promise<void>;
    sendOnboarding(to: string, name: string, role: string, temporaryPassword: string, loginUrl: string): Promise<void>;
    sendPasswordReset(to: string, name: string, otp: string): Promise<void>;
}
//# sourceMappingURL=mail.service.d.ts.map