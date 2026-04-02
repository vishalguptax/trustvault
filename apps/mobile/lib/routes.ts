/**
 * Centralized route and endpoint definitions.
 * No hardcoded strings in components — everything references this file.
 */

// ── Navigation routes ────────────────────────────────────────────

export const AUTH = {
  LOGIN: '/(auth)/login' as const,
  REGISTER: '/(auth)/register' as const,
  LOCK: '/(auth)/lock' as const,
  SETUP_MPIN: '/(auth)/setup-mpin' as const,
};

export const TABS = {
  HOME: '/(tabs)' as const,
  SCANNER: '/(tabs)/scanner' as const,
  HISTORY: '/(tabs)/history' as const,
  PROFILE: '/(tabs)/profile' as const,
  RECEIVE: '/(tabs)/receive' as const,
  PRESENT: '/(tabs)/present' as const,
  CREDENTIALS: '/(tabs)/credentials' as const,
  CREDENTIAL: (id: string) => `/(tabs)/credential/${id}` as const,
};

// ── API endpoints ────────────────────────────────────────────────

export const API = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  WALLET: {
    CREDENTIALS: (holderId: string) => `/wallet/credentials?holderId=${holderId}`,
    CREDENTIAL_CLAIMS: (id: string) => `/wallet/credentials/${id}/claims`,
    RECEIVE: '/wallet/credentials/receive',
    CREATE_PRESENTATION: '/wallet/presentations/create',
  },
  ISSUER: {
    METADATA: (baseUrl: string) => `${baseUrl}/.well-known/openid-credential-issuer`,
  },
  HEALTH: '/health',
} as const;

// ── QR URI schemes ───────────────────────────────────────────────

export const URI_SCHEME = {
  CREDENTIAL_OFFER: 'openid-credential-offer://',
  VERIFICATION: 'openid4vp://',
  VERIFICATION_ALT: 'openid-vc://',
} as const;

// ── Credential statuses ──────────────────────────────────────────

export type CredentialStatus = 'active' | 'revoked' | 'suspended' | 'expired';

// ── Setup MPIN modes ─────────────────────────────────────────────

export type SetupMpinMode = 'new' | 'change';
