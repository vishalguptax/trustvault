import { api } from './client';

export interface TrustedIssuer {
  id?: string;
  did: string;
  name: string;
  description?: string;
  credentialTypes: string[];
  website?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

export interface OnboardResult {
  user: { email: string; name: string; role: string };
  temporaryPassword: string;
  did: string | null;
  issuer: Record<string, unknown> | null;
}

export const trustApi = {
  listIssuers: () => api.get<TrustedIssuer[]>('/trust/issuers'),

  getIssuer: (did: string) => api.get<TrustedIssuer>(`/trust/issuers/${encodeURIComponent(did)}`),

  registerIssuer: (data: {
    did: string;
    name: string;
    credentialTypes: string[];
    description?: string;
  }) => api.post<TrustedIssuer>('/trust/issuers', data),

  updateIssuer: (did: string, data: { name?: string; credentialTypes?: string[]; status?: string }) =>
    api.put<TrustedIssuer>(`/trust/issuers/${encodeURIComponent(did)}`, data),

  removeIssuer: (did: string) => api.delete<void>(`/trust/issuers/${encodeURIComponent(did)}`),

  listSchemas: () => api.get<Array<{ id: string; type: string; name: string; description: string; claims: Array<{ key: string; label: string; type: string; required: boolean; selectivelyDisclosable: boolean }> }>>('/trust/schemas'),

  onboardUser: (data: {
    name: string;
    email: string;
    role: string;
    credentialTypes?: string[];
    description?: string;
  }) => api.post<OnboardResult>('/trust/onboard', data),
};
