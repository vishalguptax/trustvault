import { api } from './client';

export interface VerificationResult {
  id: string;
  credentialTypes: string[];
  result: 'verified' | 'rejected' | 'pending';
  verifierDid?: string;
  createdAt: string;
  completedAt?: string;
}

export interface VerificationDetail {
  id: string;
  result: 'verified' | 'rejected' | 'pending';
  checks: Array<{ name: string; label: string; passed: boolean }>;
  credentials: Array<{
    type: string;
    issuerDid: string;
    subjectDid: string;
    disclosedClaims: Array<{ key: string; label: string; value: string }>;
  }>;
  verifierDid: string;
  nonce: string;
  timestamp: string;
  policies: string[];
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface RawPolicy {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

function mapPolicy(raw: RawPolicy): Policy {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    enabled: raw.active,
  };
}

export interface PresentationRequest {
  requestId: string;
  authorizationRequestUri: string;
  shareUrl: string;
  nonce: string;
  state: string;
}

export const verifierApi = {
  listPresentations: () => api.get<VerificationResult[]>('/verifier/presentations'),

  getPresentation: (id: string) => api.get<VerificationDetail>(`/verifier/presentations/${id}`),

  createPresentationRequest: (data: {
    verifierDid: string;
    credentialTypes: string[];
    requiredClaims?: Record<string, string[]>;
    policies?: string[];
    verifierName?: string;
    purpose?: string;
  }) => api.post<PresentationRequest>('/verifier/presentations/request', data),

  listPolicies: async () => {
    const raw = await api.get<RawPolicy[]>('/verifier/policies');
    return raw.map(mapPolicy);
  },

  togglePolicy: (id: string, enabled: boolean) =>
    api.put<Policy>(`/verifier/policies/${id}`, { enabled }),
};
