export const configuration = () => ({
  port: parseInt(process.env.PORT || '8000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  did: {
    defaultMethod: process.env.DEFAULT_DID_METHOD || 'key',
  },
  credential: {
    defaultFormat: process.env.DEFAULT_CREDENTIAL_FORMAT || 'sd-jwt-vc',
    defaultExpiryDays: parseInt(process.env.DEFAULT_CREDENTIAL_EXPIRY_DAYS || '365', 10),
    statusListSize: parseInt(process.env.STATUS_LIST_SIZE || '131072', 10),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'trustilock-dev-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  apiBaseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || '8000'}`,
  issuer: {
    did: process.env.ISSUER_DID || '',
    baseUrl: process.env.ISSUER_BASE_URL || `${process.env.API_BASE_URL || `http://localhost:${process.env.PORT || '8000'}`}/issuer`,
  },
  webAppUrl: process.env.WEB_APP_URL || 'http://localhost:3000',
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
  },
});
