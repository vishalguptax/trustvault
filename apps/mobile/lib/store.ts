import { create } from 'zustand';

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
}

export const useCredentialStore = create<CredentialStore>((set) => ({
  credentials: [],
  consentHistory: [],
  addCredential: (credential) =>
    set((state) => ({ credentials: [...state.credentials, credential] })),
  removeCredential: (id) =>
    set((state) => ({
      credentials: state.credentials.filter((c) => c.id !== id),
    })),
  addConsentRecord: (record) =>
    set((state) => ({ consentHistory: [record, ...state.consentHistory] })),
  setCredentials: (credentials) => set({ credentials }),
}));
