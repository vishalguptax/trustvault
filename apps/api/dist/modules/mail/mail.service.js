"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var MailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
const email_templates_1 = require("./email-templates");
const DEFAULT_FROM = 'TrustiLock <noreply@sandhya.vishalg.in>';
let MailService = MailService_1 = class MailService {
    configService;
    logger = new common_1.Logger(MailService_1.name);
    resend;
    constructor(configService) {
        this.configService = configService;
        const apiKey = this.configService.get('resend.apiKey');
        if (apiKey) {
            this.resend = new resend_1.Resend(apiKey);
            this.logger.log('Resend email service initialized');
        }
        else {
            this.resend = null;
            this.logger.warn('RESEND_API_KEY is not set — emails will be skipped');
        }
    }
    async send(to, subject, html) {
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.logger.error(`Email send error: ${message}`);
        }
    }
    async sendWelcome(to, name, role) {
        const { subject, html } = (0, email_templates_1.welcomeEmail)({ name, role });
        await this.send(to, subject, html);
    }
    async sendCredentialIssued(to, recipientName, credentialType, issuerName) {
        const { subject, html } = (0, email_templates_1.credentialIssuedEmail)({ recipientName, credentialType, issuerName });
        await this.send(to, subject, html);
    }
    async sendCredentialRevoked(to, recipientName, credentialType, reason) {
        const { subject, html } = (0, email_templates_1.credentialRevokedEmail)({ recipientName, credentialType, reason });
        await this.send(to, subject, html);
    }
    async sendOnboarding(to, name, role, temporaryPassword, loginUrl) {
        const { subject, html } = (0, email_templates_1.onboardingEmail)({ name, role, email: to, temporaryPassword, loginUrl });
        await this.send(to, subject, html);
    }
    async sendPasswordReset(to, name, otp) {
        const { subject, html } = (0, email_templates_1.passwordResetEmail)({ name, otp });
        await this.send(to, subject, html);
    }
};
exports.MailService = MailService;
exports.MailService = MailService = MailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map