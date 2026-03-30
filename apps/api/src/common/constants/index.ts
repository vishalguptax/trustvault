export const CREDENTIAL_TYPES = {
  EDUCATION: 'VerifiableEducationCredential',
  INCOME: 'VerifiableIncomeCredential',
  IDENTITY: 'VerifiableIdentityCredential',
} as const;

export const CREDENTIAL_FORMATS = {
  SD_JWT_VC: 'vc+sd-jwt',
  JWT_VC: 'jwt_vc_json',
} as const;

export const DID_METHODS = {
  KEY: 'key',
  WEB: 'web',
} as const;

export const SIGNING_ALGORITHM = 'ES256' as const;

export const STATUS_PURPOSES = {
  REVOCATION: 'revocation',
  SUSPENSION: 'suspension',
} as const;

export const DEFAULT_STATUS_LIST_SIZE = 131072;

export const TRUST_POLICIES = {
  REQUIRE_TRUSTED_ISSUER: 'require-trusted-issuer',
  REQUIRE_ACTIVE_STATUS: 'require-active-status',
  REQUIRE_NON_EXPIRED: 'require-non-expired',
} as const;
