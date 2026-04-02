import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

export interface StoredCredential {
  id: string;
  type: string;
  typeName: string;
  issuerDid: string;
  issuerName: string | null;
  subjectDid: string;
  status: 'active' | 'revoked' | 'suspended' | 'expired';
  claims: Record<string, unknown>;
  sdClaims: string[];
  issuedAt: string;
  expiresAt?: string;
  rawSdJwt?: string;
}

export interface ConsentRecord {
  id: string;
  verifierName: string;
  verifierDid: string;
  credentialIds: string[];
  disclosedClaims: string[];
  result: 'verified' | 'rejected';
  timestamp: string;
}

interface CredentialStore {
  credentials: StoredCredential[];
  consentHistory: ConsentRecord[];
  addCredential: (credential: StoredCredential) => void;
  removeCredential: (id: string) => void;
  addConsentRecord: (record: ConsentRecord) => void;
  setCredentials: (credentials: StoredCredential[]) => void;
  _hasHydrated: boolean;
}

const STORAGE_KEY = 'trustvault_credentials';

/**
 * Storage adapter — uses expo-secure-store on native (encrypted),
 * falls back to in-memory on web where SecureStore is unavailable.
 */
let secureStorage: StateStorage;

if (Platform.OS === 'web') {
  // Web fallback: use localStorage
  secureStorage = {
    getItem: (name: string) => {
      const value = typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
      return Promise.resolve(value);
    },
    setItem: (name: string, value: string) => {
      if (typeof window !== 'undefined') window.localStorage.setItem(name, value);
      return Promise.resolve();
    },
    removeItem: (name: string) => {
      if (typeof window !== 'undefined') window.localStorage.removeItem(name);
      return Promise.resolve();
    },
  };
} else {
  // Native: encrypted storage
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const SecureStore = require('expo-secure-store');
  secureStorage = {
    getItem: (name: string): Promise<string | null> => {
      return SecureStore.getItemAsync(name);
    },
    setItem: (name: string, value: string): Promise<void> => {
      return SecureStore.setItemAsync(name, value);
    },
    removeItem: (name: string): Promise<void> => {
      return SecureStore.deleteItemAsync(name);
    },
  };
}

export const useCredentialStore = create<CredentialStore>()(
  persist(
    (set) => ({
      credentials: [],
      consentHistory: [],
      _hasHydrated: false,
      addCredential: (credential) =>
        set((state) => ({
          credentials: [
            ...state.credentials.filter((c) => c.id !== credential.id),
            credential,
          ],
        })),
      removeCredential: (id) =>
        set((state) => ({
          credentials: state.credentials.filter((c) => c.id !== id),
        })),
      addConsentRecord: (record) =>
        set((state) => ({
          consentHistory: [
            record,
            ...state.consentHistory.filter((r) => r.id !== record.id),
          ],
        })),
      setCredentials: (credentials) => {
        const seen = new Set<string>();
        const deduped = credentials.filter((c) => {
          if (seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });
        set({ credentials: deduped });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => () => {
        useCredentialStore.setState({ _hasHydrated: true });
      },
    },
  ),
);
