import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useCredentialStore, StoredCredential } from '@/lib/store';
import { useAuth } from '@/lib/auth/auth-context';

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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const holderId = user?.id ?? 'demo-holder';

  const refresh = useCallback(async () => {
    console.log('[Credentials] Fetching for holderId:', holderId);
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<CredentialApiItem[]>(
        `/wallet/credentials?holderId=${holderId}`,
      );
      const items = Array.isArray(response) ? response : [];
      console.log('[Credentials] Loaded', items.length, 'credentials');
      const mapped: StoredCredential[] = items.map((item) => ({
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
      console.warn('[Credentials] Error:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [setCredentials, holderId]);

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
