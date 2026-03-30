import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useCredentialStore, StoredCredential } from '@/lib/store';

const HOLDER_ID = 'demo-holder';

interface CredentialApiItem {
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

interface CredentialClaimsResponse {
  claims: Record<string, unknown>;
  sdClaims: string[];
}

interface UseCredentialsReturn {
  credentials: StoredCredential[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fetchClaims: (credentialId: string) => Promise<CredentialClaimsResponse | null>;
}

export function useCredentials(): UseCredentialsReturn {
  const credentials = useCredentialStore((state) => state.credentials);
  const setCredentials = useCredentialStore((state) => state.setCredentials);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<CredentialApiItem[]>(
        `/wallet/credentials?holderId=${HOLDER_ID}`,
      );
      const mapped: StoredCredential[] = (response ?? []).map((item) => ({
        id: item.id,
        type: item.type,
        typeName: item.typeName,
        issuerDid: item.issuerDid,
        issuerName: item.issuerName,
        subjectDid: item.subjectDid,
        status: item.status,
        claims: item.claims,
        sdClaims: item.sdClaims,
        issuedAt: item.issuedAt,
        expiresAt: item.expiresAt,
        rawSdJwt: item.rawSdJwt,
      }));
      setCredentials(mapped);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load credentials';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setCredentials]);

  const fetchClaims = useCallback(
    async (credentialId: string): Promise<CredentialClaimsResponse | null> => {
      try {
        const response = await api.get<CredentialClaimsResponse>(
          `/wallet/credentials/${credentialId}/claims`,
        );
        return response;
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { credentials, loading, error, refresh, fetchClaims };
}
