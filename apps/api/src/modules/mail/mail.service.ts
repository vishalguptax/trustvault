import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  welcomeEmail,
  credentialIssuedEmail,
  credentialRevokedEmail,
  onboardingEmail,
  passwordResetEmail,
} from './email-templates';

const DEFAULT_FROM = 'TrustiLock <noreply@sandhya.vishalg.in>';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.resend = null;
      this.logger.warn('RESEND_API_KEY is not set — emails will be skipped');
    }
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.warn(`Email skipped (no API key): "${subject}" to ${to}`);
      return;
    }

    try {
      const { error } = await this.resend.emails.send({
        from: DEFAULT_FROM,
        to,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send email "${subject}" to ${to}: ${error.message}`);
        return;
      }

      this.logger.log(`Email sent: "${subject}" to ${to}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Email send error: ${message}`);
    }
  }

  async sendWelcome(to: string, name: string, role: string): Promise<void> {
    const { subject, html } = welcomeEmail({ name, role });
    await this.send(to, subject, html);
  }

  async sendCredentialIssued(
    to: string,
    recipientName: string,
    credentialType: string,
    issuerName: string,
  ): Promise<void> {
    const { subject, html } = credentialIssuedEmail({ recipientName, credentialType, issuerName });
    await this.send(to, subject, html);
  }

  async sendCredentialRevoked(
    to: string,
    recipientName: string,
    credentialType: string,
    reason: string,
  ): Promise<void> {
    const { subject, html } = credentialRevokedEmail({ recipientName, credentialType, reason });
    await this.send(to, subject, html);
  }

  async sendOnboarding(
    to: string,
    name: string,
    role: string,
    temporaryPassword: string,
    loginUrl: string,
  ): Promise<void> {
    const { subject, html } = onboardingEmail({ name, role, email: to, temporaryPassword, loginUrl });
    await this.send(to, subject, html);
  }

  async sendPasswordReset(to: string, name: string, otp: string): Promise<void> {
    const { subject, html } = passwordResetEmail({ name, otp });
    await this.send(to, subject, html);
  }
}
