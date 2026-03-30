export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const CREDENTIAL_TYPE_CONFIG = {
  VerifiableEducationCredential: {
    name: 'Education Credential',
    accent: 'credential-education',
    icon: 'GraduationCap',
  },
  VerifiableIncomeCredential: {
    name: 'Income Credential',
    accent: 'credential-income',
    icon: 'CurrencyDollar',
  },
  VerifiableIdentityCredential: {
    name: 'Identity Credential',
    accent: 'credential-identity',
    icon: 'IdentificationCard',
  },
} as const;
