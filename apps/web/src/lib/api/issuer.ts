import { api } from './client';

export interface Credential {
  id: string;
  type: string;
  subjectDid: string;
  issuerDid: string;
  status: 'active' | 'revoked' | 'suspended' | 'expired';
  issuedAt: string;
  claims?: Record<string, string>;
}

export interface ClaimDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  selectivelyDisclosable: boolean;
}

export interface Schema {
  id: string;
  type: string;
  name: string;
  description: string;
  claims: ClaimDefinition[];
}

export interface IssuerAuthorization {
  authorized: boolean;
  credentialTypes: string[];
  issuer: { did: string; name: string; description?: string } | null;
}

export interface OfferResult {
  offerId: string;
  credentialOfferUri: string;
  preAuthorizedCode: string;
}

export interface Offer {
  id: string;
  schemaTypeUri: string;
  status: 'pending' | 'token_issued' | 'credential_issued' | 'expired';
  claims: Record<string, unknown>;
  credentialOfferUri: string | null;
  preAuthorizedCode: string;
  createdAt: string;
  expiresAt: string;
}

export const issuerApi = {
  listOffers: () => api.get<Offer[]>('/issuer/offers'),

  listCredentials: () => api.get<Credential[]>('/issuer/credentials'),

  listSchemas: () => api.get<Schema[]>('/issuer/schemas'),

  getAuthorization: () => api.get<IssuerAuthorization>('/trust/issuers/me'),

  createOffer: (data: { schemaTypeUri: string; claims: Record<string, unknown> }) =>
    api.post<OfferResult>('/issuer/offers', data),

  createBulkOffers: (data: { schemaTypeUri: string; offers: Array<{ claims: Record<string, string> }> }) =>
    api.post<{ total: number; successful: number; failed: number; results: Array<{ offerId?: string; credentialOfferUri?: string; error?: string }> }>('/issuer/offers/batch', data),

  revokeCredential: (credentialId: string, reason: string) =>
    api.post<void>('/status/revoke', { credentialId, reason }),
};
