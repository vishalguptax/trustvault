/**
 * TrustiLock Email Templates
 *
 * Professional, trust-focused HTML email templates.
 * All styles are inline for maximum email client compatibility.
 * Mobile-responsive with 600px max-width container.
 */

const BRAND = {
  primary: '#0f1b3d',
  accent: '#0d9488',
  accentLight: '#e6f7f5',
  textPrimary: '#1a1a2e',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  background: '#f8f9fb',
  white: '#ffffff',
} as const;

function layout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TrustiLock</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.background};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.background};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${BRAND.white};border-radius:8px;border:1px solid ${BRAND.border};overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.primary};padding:24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size:22px;font-weight:700;color:${BRAND.white};letter-spacing:0.5px;">TrustiLock</span>
                  </td>
                  <td align="right">
                    <span style="font-size:12px;color:rgba(255,255,255,0.6);letter-spacing:1px;text-transform:uppercase;">Verifiable Credentials</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BRAND.border};background-color:${BRAND.background};">
              <p style="margin:0;font-size:12px;color:${BRAND.textSecondary};line-height:1.5;text-align:center;">
                This is an automated message from TrustiLock. Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    holder: 'Credential Holder',
    issuer: 'Credential Issuer',
    verifier: 'Credential Verifier',
    admin: 'Trust Administrator',
  };
  return labels[role] || role;
}

export function welcomeEmail(params: { name: string; role: string }): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.primary};">Welcome to TrustiLock</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
      Your account has been created successfully.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.accentLight};border-radius:6px;border-left:4px solid ${BRAND.accent};">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:13px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Account Details</p>
          <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:${BRAND.textPrimary};">${params.name}</p>
          <p style="margin:0;font-size:14px;color:${BRAND.accent};font-weight:500;">${roleLabel(params.role)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textSecondary};line-height:1.6;">
      You can now sign in and start using TrustiLock to manage verifiable credentials securely.
    </p>`;

  return {
    subject: 'Welcome to TrustiLock',
    html: layout(content),
  };
}

export function credentialIssuedEmail(params: {
  recipientName: string;
  credentialType: string;
  issuerName: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.primary};">Credential Received</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
      A new verifiable credential has been added to your wallet.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.accentLight};border-radius:6px;border-left:4px solid ${BRAND.accent};">
      <tr>
        <td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:12px;">
                <p style="margin:0 0 2px;font-size:12px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Credential Type</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.textPrimary};">${params.credentialType}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:12px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Issued By</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.textPrimary};">${params.issuerName}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textSecondary};line-height:1.6;">
      Open TrustiLock to view the full credential details and manage selective disclosure settings.
    </p>`;

  return {
    subject: `New Credential: ${params.credentialType}`,
    html: layout(content),
  };
}

export function credentialRevokedEmail(params: {
  recipientName: string;
  credentialType: string;
  reason: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.primary};">Credential Revoked</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
      A verifiable credential in your wallet has been revoked by the issuer.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef2f2;border-radius:6px;border-left:4px solid #dc2626;">
      <tr>
        <td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:12px;">
                <p style="margin:0 0 2px;font-size:12px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Credential Type</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.textPrimary};">${params.credentialType}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:12px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Reason</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:#dc2626;">${params.reason}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:14px;color:${BRAND.textSecondary};line-height:1.6;">
      This credential can no longer be used for verification. Contact the issuer if you believe this was done in error.
    </p>`;

  return {
    subject: `Credential Revoked: ${params.credentialType}`,
    html: layout(content),
  };
}

export function onboardingEmail(params: {
  name: string;
  role: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.primary};">You have been invited to TrustiLock</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
      An administrator has created a <strong>${roleLabel(params.role)}</strong> account for you. Use the credentials below to sign in.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.accentLight};border-radius:6px;border-left:4px solid ${BRAND.accent};">
      <tr>
        <td style="padding:16px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-bottom:8px;">
                <p style="margin:0 0 2px;font-size:12px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Name</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.textPrimary};">${params.name}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:8px;">
                <p style="margin:0 0 2px;font-size:12px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Email</p>
                <p style="margin:0;font-size:16px;font-weight:600;color:${BRAND.textPrimary};">${params.email}</p>
              </td>
            </tr>
            <tr>
              <td style="padding-bottom:8px;">
                <p style="margin:0 0 2px;font-size:12px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</p>
                <p style="margin:0;font-size:16px;font-weight:700;color:${BRAND.accent};font-family:'Courier New',monospace;letter-spacing:1px;">${params.temporaryPassword}</p>
              </td>
            </tr>
            <tr>
              <td>
                <p style="margin:0 0 2px;font-size:12px;color:${BRAND.textSecondary};text-transform:uppercase;letter-spacing:0.5px;">Role</p>
                <p style="margin:0;font-size:14px;font-weight:500;color:${BRAND.accent};">${roleLabel(params.role)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td align="center">
          <a href="${params.loginUrl}" style="display:inline-block;background-color:${BRAND.accent};color:${BRAND.white};font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:6px;">
            Sign In to TrustiLock
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:24px 0 0;font-size:13px;color:${BRAND.textSecondary};line-height:1.6;text-align:center;">
      Please change your password after your first sign-in.
    </p>`;

  return {
    subject: 'You have been invited to TrustiLock',
    html: layout(content),
  };
}

export function passwordResetEmail(params: {
  name: string;
  otp: string;
}): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:${BRAND.primary};">Password Reset</h1>
    <p style="margin:0 0 24px;font-size:15px;color:${BRAND.textSecondary};line-height:1.6;">
      Hi ${params.name}, use the code below to reset your password.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:24px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="background-color:${BRAND.primary};border-radius:8px;">
            <tr>
              <td style="padding:16px 40px;">
                <span style="font-size:32px;font-weight:700;color:${BRAND.white};letter-spacing:8px;font-family:'Courier New',monospace;">${params.otp}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.background};border-radius:6px;">
      <tr>
        <td style="padding:12px 16px;text-align:center;">
          <p style="margin:0;font-size:13px;color:${BRAND.textSecondary};line-height:1.5;">
            This code expires in <strong style="color:${BRAND.textPrimary};">15 minutes</strong>. If you did not request a password reset, ignore this email.
          </p>
        </td>
      </tr>
    </table>`;

  return {
    subject: 'TrustiLock Password Reset Code',
    html: layout(content),
  };
}
