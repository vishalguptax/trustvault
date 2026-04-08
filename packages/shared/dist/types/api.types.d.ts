/** Standard API response wrapper */
export interface ApiSuccessResponse<T> {
    data: T;
    message?: string;
}
/** Standard API error response */
export interface ApiErrorResponse {
    error: string;
    statusCode: number;
    message: string;
}
/** Credential as stored in wallet (frontend view) */
export interface WalletCredential {
    id: string;
    type: string;
    typeName: string;
    issuerDid: string;
    issuerName: string;
    subjectDid: string;
    status: CredentialStatus;
    claims: Record<string, unknown>;
    sdClaims: string[];
    issuedAt: string;
    expiresAt?: string;
}
/** Credential status enum */
export type CredentialStatus = 'active' | 'revoked' | 'suspended' | 'expired';
/** Consent history entry */
export interface ConsentRecord {
    id: string;
    verifierName: string;
    verifierDid: string;
    credentialIds: string[];
    disclosedClaims: string[];
    result: 'verified' | 'rejected';
    timestamp: string;
}
/** Trusted issuer (from trust registry) */
export interface TrustedIssuer {
    did: string;
    name: string;
    description?: string;
    credentialTypes: string[];
    website?: string;
    status: 'active' | 'inactive';
    registeredAt: string;
}
/** Issuer dashboard stats */
export interface IssuerStats {
    totalIssued: number;
    active: number;
    revoked: number;
}
/** Verifier dashboard stats */
export interface VerifierStats {
    totalVerifications: number;
    verified: number;
    rejected: number;
}
//# sourceMappingURL=api.types.d.ts.map