"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRUST_POLICIES = exports.DEFAULT_STATUS_LIST_SIZE = exports.STATUS_PURPOSES = exports.SIGNING_ALGORITHM = exports.DID_METHODS = exports.CREDENTIAL_FORMATS = exports.CREDENTIAL_TYPES = void 0;
exports.CREDENTIAL_TYPES = {
    EDUCATION: 'VerifiableEducationCredential',
    INCOME: 'VerifiableIncomeCredential',
    IDENTITY: 'VerifiableIdentityCredential',
};
exports.CREDENTIAL_FORMATS = {
    SD_JWT_VC: 'vc+sd-jwt',
    JWT_VC: 'jwt_vc_json',
};
exports.DID_METHODS = {
    KEY: 'key',
    WEB: 'web',
};
exports.SIGNING_ALGORITHM = 'ES256';
exports.STATUS_PURPOSES = {
    REVOCATION: 'revocation',
    SUSPENSION: 'suspension',
};
exports.DEFAULT_STATUS_LIST_SIZE = 131072;
exports.TRUST_POLICIES = {
    REQUIRE_TRUSTED_ISSUER: 'require-trusted-issuer',
    REQUIRE_ACTIVE_STATUS: 'require-active-status',
    REQUIRE_NON_EXPIRED: 'require-non-expired',
};
//# sourceMappingURL=index.js.map