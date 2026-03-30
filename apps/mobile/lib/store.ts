import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export interface StoredCredential {
  id: string;
  type: string;
  typeName: string;
  issuerDid: string;
  issuerName: string;
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
 * Secure storage adapter backed by expo-secure-store.
 * Data is encrypted at rest on device.
 */
const secureStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return SecureStore.getItemAsync(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await SecureStore.deleteItemAsync(name);
  },
};

export const useCredentialStore = create<CredentialStore>()(
  persist(
    (set) => ({
      credentials: [],
      consentHistory: [],
      _hasHydrated: false,
      addCredential: (credential) =>
        set((state) => ({ credentials: [...state.credentials, credential] })),
      removeCredential: (id) =>
        set((state) => ({
          credentials: state.credentials.filter((c) => c.id !== id),
        })),
      addConsentRecord: (record) =>
        set((state) => ({ consentHistory: [record, ...state.consentHistory] })),
      setCredentials: (credentials) => set({ credentials }),
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
