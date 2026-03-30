export const configuration = () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  did: {
    defaultMethod: process.env.DEFAULT_DID_METHOD || 'key',
  },
  credential: {
    defaultFormat: process.env.DEFAULT_CREDENTIAL_FORMAT || 'sd-jwt-vc',
    defaultExpiryDays: parseInt(process.env.DEFAULT_CREDENTIAL_EXPIRY_DAYS || '365', 10),
    statusListSize: parseInt(process.env.STATUS_LIST_SIZE || '131072', 10),
  },
  issuer: {
    did: process.env.ISSUER_DID || '',
    baseUrl: process.env.ISSUER_BASE_URL || 'http://localhost:3000/issuer',
  },
});
