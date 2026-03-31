export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

console.log('[Config] API_BASE_URL:', API_BASE_URL);

export const CREDENTIAL_TYPE_CONFIG = {
  VerifiableEducationCredential: {
    name: 'Education Credential',
    accent: '#7C3AED',
    gradientStart: '#7C3AED',
    gradientEnd: '#4F46E5',
  },
  VerifiableIncomeCredential: {
    name: 'Income Credential',
    accent: '#14B8A6',
    gradientStart: '#14B8A6',
    gradientEnd: '#10B981',
  },
  VerifiableIdentityCredential: {
    name: 'Identity Credential',
    accent: '#F59E0B',
    gradientStart: '#F59E0B',
    gradientEnd: '#F97316',
  },
} as const;
