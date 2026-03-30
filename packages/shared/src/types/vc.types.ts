import type { JWK } from 'jose';

export interface SdJwtVcPayload {
  iss: string;
  sub: string;
  iat: number;
  exp?: number;
  vct: string;
  status?: {
    status_list: {
      idx: number;
      uri: string;
    };
  };
  cnf?: {
    jwk: JWK;
  };
  _sd: string[];
  _sd_alg: string;
  [key: string]: unknown;
}

export interface CredentialSchema {
  typeUri: string;
  name: string;
  description?: string;
  schema: Record<string, { type: string }>;
  sdClaims: string[];
}

export interface CredentialOffer {
  credential_issuer: string;
  credential_configuration_ids: string[];
  grants: {
    'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
      'pre-authorized_code': string;
      user_pin_required?: boolean;
    };
  };
}

export interface VerificationResult {
  verified: boolean;
  checks: {
    signature: { valid: boolean; error?: string };
    expiration: { valid: boolean; error?: string };
    status: { valid: boolean; error?: string };
    trust: { valid: boolean; error?: string };
    policy: { valid: boolean; error?: string };
  };
  credentials?: VerifiedCredential[];
}

export interface VerifiedCredential {
  credentialType: string;
  issuerDid: string;
  subjectDid: string;
  disclosedClaims: Record<string, unknown>;
  issuedAt: string;
  expiresAt?: string;
}
