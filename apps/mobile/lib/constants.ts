import Constants from 'expo-constants';

function getApiUrl(): string {
  // 1. Explicit env var takes priority
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // 2. In dev mode, use the debugger host IP (same machine running Metro)
  const debuggerHost = Constants.expoConfig?.hostUri ?? Constants.experienceUrl;
  if (__DEV__ && debuggerHost) {
    const host = debuggerHost.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:8000`;
    }
  }

  // 3. Fallback
  return 'http://localhost:8000';
}

export const API_BASE_URL = getApiUrl();

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
