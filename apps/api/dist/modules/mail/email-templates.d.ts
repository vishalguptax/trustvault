/**
 * TrustiLock Email Templates
 *
 * Professional, trust-focused HTML email templates.
 * All styles are inline for maximum email client compatibility.
 * Mobile-responsive with 600px max-width container.
 */
export declare function welcomeEmail(params: {
    name: string;
    role: string;
}): {
    subject: string;
    html: string;
};
export declare function credentialIssuedEmail(params: {
    recipientName: string;
    credentialType: string;
    issuerName: string;
}): {
    subject: string;
    html: string;
};
export declare function credentialRevokedEmail(params: {
    recipientName: string;
    credentialType: string;
    reason: string;
}): {
    subject: string;
    html: string;
};
export declare function onboardingEmail(params: {
    name: string;
    role: string;
    email: string;
    temporaryPassword: string;
    loginUrl: string;
}): {
    subject: string;
    html: string;
};
export declare function passwordResetEmail(params: {
    name: string;
    otp: string;
}): {
    subject: string;
    html: string;
};
//# sourceMappingURL=email-templates.d.ts.map