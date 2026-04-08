export declare const CREDENTIAL_TYPES: {
    readonly EDUCATION: "VerifiableEducationCredential";
    readonly INCOME: "VerifiableIncomeCredential";
    readonly IDENTITY: "VerifiableIdentityCredential";
};
export declare const CREDENTIAL_FORMATS: {
    readonly SD_JWT_VC: "vc+sd-jwt";
    readonly JWT_VC: "jwt_vc_json";
};
export declare const DID_METHODS: {
    readonly KEY: "key";
    readonly WEB: "web";
};
export declare const SIGNING_ALGORITHM: "ES256";
export declare const STATUS_PURPOSES: {
    readonly REVOCATION: "revocation";
    readonly SUSPENSION: "suspension";
};
export declare const DEFAULT_STATUS_LIST_SIZE = 131072;
export declare const CLAIM_LABELS: Record<string, string>;
export declare const TRUST_POLICIES: {
    readonly REQUIRE_TRUSTED_ISSUER: "require-trusted-issuer";
    readonly REQUIRE_ACTIVE_STATUS: "require-active-status";
    readonly REQUIRE_NON_EXPIRED: "require-non-expired";
};
//# sourceMappingURL=constants.d.ts.map