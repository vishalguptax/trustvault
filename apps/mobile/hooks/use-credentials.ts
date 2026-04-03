import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '@/lib/api';
import { useCredentialStore, StoredCredential } from '@/lib/store';
import { useAuth } from '@/lib/auth/auth-context';
import { CREDENTIAL_TYPE_CONFIG } from '@/lib/constants';
import { API } from '@/lib/routes';

/** Raw shape from backend WalletCredential (enriched with typeName/issuerName) */
interface WalletCredentialApi {
  id: string;
  holderId: string;
  rawCredential: string;
  format: string;
  credentialType: string;
  issuerDid: string;
  subjectDid?: string;
  claims: Record<string, unknown>;
  sdClaims: string[];
  issuedAt: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  typeName?: string;
  issuerName?: string | null;
}

/** Backend wraps list in { credentials, total } */
interface CredentialListResponse {
  credentials: WalletCredentialApi[];
  total: number;
}

/** Backend claims endpoint returns fixedClaims/selectiveClaims arrays */
interface ClaimItem {
  key: string;
  value: unknown;
  selectable: boolean;
}

interface CredentialClaimsApiResponse {
  fixedClaims: ClaimItem[];
  selectiveClaims: ClaimItem[];
}

/** What the UI expects */
export interface CredentialClaimsResponse {
  claims: Record<string, unknown>;
  sdClaims: string[];
}

/** Map backend record to StoredCredential */
function mapToStoredCredential(item: WalletCredentialApi): StoredCredential {
  const typeConfig =
    CREDENTIAL_TYPE_CONFIG[item.credentialType as keyof typeof CREDENTIAL_TYPE_CONFIG];
  const claimsObj = item.claims ?? {};

  return {
    id: item.id,
    type: item.credentialType,
    typeName: item.typeName ?? typeConfig?.name ?? item.credentialType,
    issuerDid: item.issuerDid,
    issuerName: item.issuerName ?? null,
    subjectDid: item.subjectDid ?? (claimsObj.sub as string) ?? '',
    status: 'active',
    claims: item.claims,
    sdClaims: item.sdClaims ?? [],
    issuedAt: item.issuedAt,
    expiresAt: item.expiresAt,
    rawSdJwt: item.rawCredential,
  };
}

/** Fetch credentials from API */
async function fetchCredentials(holderId: string): Promise<StoredCredential[]> {
  const response = await api.get<CredentialListResponse | WalletCredentialApi[]>(
    API.WALLET.CREDENTIALS(holderId),
  );

  let rawItems: WalletCredentialApi[];
  if (Array.isArray(response)) {
    rawItems = response;
  } else if (response && typeof response === 'object' && 'credentials' in response) {
    rawItems = (response as CredentialListResponse).credentials ?? [];
  } else {
    rawItems = [];
  }

  return rawItems.map(mapToStoredCredential);
}

/** Fetch claims for a credential */
async function fetchClaimsApi(credentialId: string): Promise<CredentialClaimsResponse> {
  const response = await api.get<CredentialClaimsApiResponse>(
    API.WALLET.CREDENTIAL_CLAIMS(credentialId),
  );

  const claims: Record<string, unknown> = {};
  const sdClaims: string[] = [];

  for (const item of response.fixedClaims ?? []) {
    claims[item.key] = item.value;
  }
  for (const item of response.selectiveClaims ?? []) {
    claims[item.key] = item.value;
    sdClaims.push(item.key);
  }

  return { claims, sdClaims };
}

// ── Query keys ───────────────────────────────────────────────────

export const credentialKeys = {
  all: ['credentials'] as const,
  list: (holderId: string) => [...credentialKeys.all, 'list', holderId] as const,
  claims: (id: string) => [...credentialKeys.all, 'claims', id] as const,
};

// ── Hooks ────────────────────────────────────────────────────────

export function useCredentials() {
  const { user } = useAuth();
  const setCredentials = useCredentialStore((state) => state.setCredentials);
  const credentials = useCredentialStore((state) => state.credentials);
  const queryClient = useQueryClient();
  const holderId = user?.id ?? 'demo-holder';

  const query = useQuery({
    queryKey: credentialKeys.list(holderId),
    queryFn: async () => {
      const items = await fetchCredentials(holderId);
      setCredentials(items);
      return items;
    },
    enabled: !!user?.id,
  });

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: credentialKeys.list(holderId) });
  }, [queryClient, holderId]);

  return {
    credentials,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refresh,
  };
}

export function useCredentialClaims(credentialId: string) {
  return useQuery({
    queryKey: credentialKeys.claims(credentialId),
    queryFn: () => fetchClaimsApi(credentialId),
    enabled: !!credentialId,
  });
}
