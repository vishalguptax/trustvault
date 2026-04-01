import Constants from 'expo-constants';

const API_PORT = 8000;

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (__DEV__) {
    const host =
      Constants.expoConfig?.hostUri?.split(':')[0] ??
      Constants.expoGoConfig?.debuggerHost?.split(':')[0];

    if (host) {
      return `http://${host}:${API_PORT}`;
    }
  }

  return `http://localhost:${API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const CREDENTIAL_TYPE_CONFIG: Record<string, CredentialTypeStyle> = {
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
};

interface CredentialTypeStyle {
  name: string;
  accent: string;
  gradientStart: string;
  gradientEnd: string;
}
