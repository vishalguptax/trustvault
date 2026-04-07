# TrustiLock -- Technical Architecture

> Version 0.1.0 | Last updated: 2026-03-31
>
> Audience: developers, security auditors, thesis reviewers.
> All file paths are relative to the repository root unless stated otherwise.

---

## 1. System Overview

### 1.1 Monorepo Structure

TrustiLock is a Turborepo monorepo managed with **pnpm workspaces**.

```
trustilock/
  apps/
    api/            # NestJS modular monolith  (@trustilock/api)
    web/            # Next.js + shadcn/ui portals (issuer, verifier, admin)
    mobile/         # React Native + Expo wallet
  packages/
    shared/         # Cross-app TypeScript types (@trustilock/shared)
  infrastructure/
    docker-compose.yml
    seed/seed-data.ts
```

### 1.2 Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Runtime | Node.js | 20 LTS | Server runtime |
| Framework | NestJS | 11.x | API framework (modules, DI, guards, pipes) |
| ODM | Mongoose | 8.x | MongoDB access, schema validation, query building |
| Database | MongoDB Atlas | 7.x (cloud) | Document store (free tier) |
| Credential signing | jose | 5.x | JWK, JWS, JWT, ES256 operations |
| SD-JWT | @sd-jwt/sd-jwt-vc | 0.7.x | SD-JWT-VC issue, verify, present |
| Status list | pako | 2.1.x | Gzip compress/decompress for bitstring |
| Auth | @nestjs/jwt, bcrypt | 11.x / 6.x | JWT tokens, password hashing |
| Validation | class-validator, class-transformer | 0.14 / 0.5 | DTO validation |
| Security headers | helmet | 8.x | HTTP security headers |
| Compression | compression | 1.8.x | Response gzip |
| Rate limiting | @nestjs/throttler | 6.5.x | IP-based throttling |
| API docs | @nestjs/swagger | 11.x | OpenAPI 3 generation |
| Testing | Vitest, Supertest | 1.x / 6.x | Unit and integration tests |
| Build | SWC (unplugin-swc) | 1.4.x | Fast TypeScript compilation |
| Monorepo | Turborepo | -- | Task orchestration, caching |

### 1.3 Architecture Diagram

```
                          +-------------------+
                          |   Mobile Wallet   |
                          |  (Expo / React    |
                          |   Native)         |
                          +--------+----------+
                                   |
                                   | HTTP/JSON
                                   v
+-------------------+     +--------+----------+     +-------------------+
|   Web Portals     | --> |    NestJS API      | --> |   MongoDB Atlas   |
| (Next.js/shadcn)  |     |   (Port 8000)      |     |   (cloud)         |
+-------------------+     +--------+----------+     +-------------------+
                                   |
                          +--------+----------+
                          |     Modules       |
                          |                   |
                          | Auth  DID  Crypto |
                          | Issuer  Wallet    |
                          | Verifier  Status  |
                          | Trust             |
                          +-------------------+
                                   |
                          +--------+----------+
                          |     Mongoose      |
                          +-------------------+
```

Request flow: Client --> CorrelationIdMiddleware --> LoggingMiddleware --> ThrottlerGuard --> JwtAuthGuard --> RolesGuard --> ValidationPipe --> Controller --> Service --> DatabaseService --> MongoDB.

Response flow: Service result --> ResponseInterceptor (wraps in `{ success, statusCode, data, timestamp }`) --> Client. Errors caught by AllExceptionsFilter.

---

## 2. Application Bootstrap

**File:** `apps/api/src/main.ts`

The `bootstrap()` function executes the following sequence:

1. **Environment loading** -- `dotenv.config()` runs before any NestJS import (line 1-2).
2. **Application creation** -- `NestFactory.create(AppModule)` with logger levels `['error', 'warn', 'log', 'debug']`.
3. **Database connection** -- Mongoose connects automatically via `MongooseModule.forRoot()` using the `DATABASE_URL` environment variable. If the connection fails, the process exits with code 1.
4. **Security headers** -- `helmet()` with `crossOriginResourcePolicy: 'cross-origin'` and `crossOriginOpenerPolicy: false`.
5. **Compression** -- `compression({ threshold: 1024 })` -- responses under 1 KB are not compressed.
6. **Global filters** -- `AllExceptionsFilter` (catches all thrown exceptions).
7. **Global interceptors** -- `ResponseInterceptor` (wraps successful responses).
8. **Global pipes** -- `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
9. **CORS** -- `enableCors()` with origin from `CORS_ORIGIN` env var (default `*`), methods `GET/POST/PUT/DELETE/PATCH`, credentials enabled.
10. **Swagger** -- `DocumentBuilder` creates OpenAPI spec at `/api/docs`, version `0.1.0`, with Bearer auth scheme.
11. **Shutdown hooks** -- `enableShutdownHooks()` plus manual `SIGTERM`/`SIGINT` handlers.
12. **Listen** -- Binds to `PORT` (default `8000`).

### 2.1 AppModule

**File:** `apps/api/src/app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule, DidModule, CryptoModule, IssuerModule,
    WalletModule, StatusModule, TrustModule, VerifierModule, AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware, LoggingMiddleware).forRoutes('*');
  }
}
```

Guard execution order (NestJS APP_GUARD registration order): ThrottlerGuard --> JwtAuthGuard --> RolesGuard.

### 2.2 Configuration

**File:** `apps/api/src/config/configuration.ts`

The `configuration()` factory returns a typed object consumed via `ConfigService.get<T>()`:

```typescript
{
  port: number,                      // PORT || 8000
  nodeEnv: string,                   // NODE_ENV || 'development'
  database: { url: string },         // DATABASE_URL
  cors: { origin: string },          // CORS_ORIGIN || '*'
  did: { defaultMethod: string },    // DEFAULT_DID_METHOD || 'key'
  credential: {
    defaultFormat: string,           // DEFAULT_CREDENTIAL_FORMAT || 'sd-jwt-vc'
    defaultExpiryDays: number,       // DEFAULT_CREDENTIAL_EXPIRY_DAYS || 365
    statusListSize: number,          // STATUS_LIST_SIZE || 131072
  },
  jwt: {
    secret: string,                  // JWT_SECRET || 'trustilock-dev-secret-...'
    accessExpiry: string,            // JWT_ACCESS_EXPIRY || '15m'
    refreshExpiry: string,           // JWT_REFRESH_EXPIRY || '7d'
  },
  issuer: {
    did: string,                     // ISSUER_DID || ''
    baseUrl: string,                 // ISSUER_BASE_URL || 'http://localhost:{PORT}/issuer'
  },
}
```

---

## 3. Database Layer

### 3.1 DatabaseService

**File:** `apps/api/src/database/database.service.ts`

`DatabaseService` wraps the Mongoose connection and implements `OnModuleDestroy`.

| Method | Behavior |
|---|---|
| `onModuleDestroy()` | Closes the Mongoose connection |
| `isConnected(): boolean` | Returns whether the Mongoose connection is ready |

### 3.2 Mongoose Schemas

**Directory:** `apps/api/src/database/schemas/`

Datasource: MongoDB Atlas. Schemas defined as TypeScript classes with `@Schema()` decorator.

#### Models

| Model | Collection | Key Fields | Unique Constraints | Indexes |
|---|---|---|---|---|
| `User` | `users` | email, passwordHash, name, role, refreshTokens[], apiKeys[] | `email` | `role` |
| `Did` | `dids` | did, method, document (JSON), keys (DidKey[]) | `did` | -- |
| `CredentialSchema` | `credential_schemas` | typeUri, name, schema (JSON), sdClaims[] | `typeUri` | -- |
| `CredentialOffer` | `credential_offers` | issuerDid, schemaTypeUri, preAuthorizedCode, claims (JSON), accessToken, cNonce, status | `preAuthorizedCode` | -- |
| `IssuedCredential` | `issued_credentials` | issuerDid, subjectDid, schemaTypeUri, credentialHash, statusListId?, statusListIndex?, status | `credentialHash` | `issuerDid`, `subjectDid`, `status` |
| `StatusList` | `status_lists` | issuerDid, purpose, encodedList, currentIndex, size | -- | `issuerDid` |
| `TrustedIssuer` | `trusted_issuers` | did, name, credentialTypes[], status | `did` | -- |
| `TrustPolicy` | `trust_policies` | name, rules (JSON), active | `name` | -- |
| `WalletCredential` | `wallet_credentials` | holderId, rawCredential, format, credentialType, issuerDid, claims (JSON), sdClaims[] | -- | `holderId`, `credentialType` |
| `WalletDid` | `wallet_dids` | holderId, did, method, keyData (JSON), isPrimary | `did` | `holderId` |
| `ConsentRecord` | `consent_records` | holderId, verifierDid, credentialIds[], disclosedClaims (JSON), purpose | -- | `holderId` |
| `VerificationRequest` | `verification_requests` | verifierDid, presentationDefinition (JSON), nonce, state, requiredCredentialTypes[], policies[], status, result (JSON) | `nonce`, `state` | -- |
| `VerifierPolicy` | `verifier_policies` | name, rules (JSON), active | `name` | -- |
| `AuditLog` | `audit_logs` | action, actorDid, targetId, details (JSON), timestamp | -- | `actorDid`, `action`, `timestamp` |

#### Embedded Types

| Type | Fields |
|---|---|
| `ApiKey` | hash (String), name (String), createdAt (DateTime) |
| `DidKey` | kid, type, publicKeyJwk (JSON), privateKeyJwk (JSON?), purposes (String[]) |

All primary keys use `@id @default(auto()) @map("_id") @db.ObjectId` (MongoDB ObjectId).

---

## 4. Authentication and Authorization

**Files:**
- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`
- `apps/api/src/modules/auth/guards/roles.guard.ts`
- `apps/api/src/modules/auth/guards/api-key.guard.ts`

### 4.1 Registration Flow

`AuthService.register(email, password, name, role='holder')`:

1. Check for existing user by email (throws `ConflictException` if found).
2. Hash password with `bcrypt.hash(password, 12)` -- 12 salt rounds.
3. Create User record with `refreshTokens: []`, `apiKeys: []`, `active: true`.
4. Generate token pair via `generateTokens()`.
5. Store refresh token hash in DB via `storeRefreshToken()`.
6. Return `{ access_token, refresh_token, user }`.

### 4.2 Token Generation

`AuthService.generateTokens(userId, role)`:

```typescript
interface TokenPayload { sub: string; role: string; type: 'access' | 'refresh' }
```

- Access token: `JwtService.signAsync(payload, { expiresIn: '15m' })` -- HS256 with `JWT_SECRET`.
- Refresh token: `JwtService.signAsync(payload, { expiresIn: '7d' })` -- same algorithm.

Both tokens share the same signing key. Differentiated by `type` field in payload.

### 4.3 Refresh Token Rotation

`AuthService.refreshToken(refreshToken)`:

1. Verify JWT signature and expiry via `jwtService.verifyAsync()`.
2. Reject if `payload.type !== 'refresh'`.
3. Look up user, reject if not found or inactive.
4. Hash incoming token with `SHA-256` and check against `user.refreshTokens[]`.
5. **Reuse detection:** If hash not found but user exists, clear ALL refresh tokens and throw `UnauthorizedException` (family invalidation).
6. On success: remove old hash, generate new token pair, store new refresh hash.

Token hashing: `createHash('sha256').update(token).digest('hex')`.

### 4.4 API Key Authentication

`AuthService.generateApiKey(userId, keyName)`:

- Format: `tvk_` + `randomBytes(32).toString('hex')` -- 68 characters total.
- Stored as SHA-256 hex hash in `User.apiKeys[]` array (as `ApiKey` embedded type).

`AuthService.validateApiKey(key)`:

- Hashes incoming key with SHA-256.
- Queries `UserModel.find()` filtering `apiKeys` array for matching hash and `active: true`.

### 4.5 JwtAuthGuard

**File:** `apps/api/src/modules/auth/guards/jwt-auth.guard.ts`

Implements `CanActivate`:

1. Check `@Public()` decorator via `Reflector.getAllAndOverride(IS_PUBLIC_KEY, [...])`. If `true`, skip auth.
2. Extract Bearer token from `Authorization` header.
3. Verify via `jwtService.verifyAsync(token)`.
4. Reject if `payload.type !== 'access'`.
5. Load user via `authService.validateUser(payload.sub)`, attach to `request.user`.

### 4.6 RolesGuard

**File:** `apps/api/src/modules/auth/guards/roles.guard.ts`

1. Read `@Roles()` metadata via `Reflector.getAllAndOverride(ROLES_KEY, [...])`.
2. If no roles required, allow.
3. Check `request.user.role` against required roles array.
4. Throw `ForbiddenException` with descriptive message on mismatch.

### 4.7 ApiKeyGuard

**File:** `apps/api/src/modules/auth/guards/api-key.guard.ts`

- Reads `x-api-key` header.
- Calls `authService.validateApiKey(apiKey)`.
- Sets `request.user` to the resolved user identity.
- Not registered as a global guard -- applied selectively via `@UseGuards(ApiKeyGuard)`.

---

## 5. DID Module

**Files:**
- `apps/api/src/modules/did/did.service.ts`
- `apps/api/src/modules/did/providers/did-key.provider.ts`

### 5.1 DidKeyProvider

Key generation:

```
jose.generateKeyPair('ES256', { extractable: true })
  --> jose.exportJWK(publicKey), jose.exportJWK(privateKey)
  --> jose.calculateJwkThumbprint(publicJwk, 'sha256')  --> kid
```

DID creation:

- DID identifier: `did:key:z{thumbprint}` where thumbprint is the SHA-256 JWK thumbprint.
- Verification method type: `JsonWebKey2020`.
- Verification method ID: `{did}#{kid}`.
- DID document contexts: `https://www.w3.org/ns/did/v1`, `https://w3id.org/security/suites/jws-2020/v1`.
- Purposes: `authentication`, `assertionMethod`.

### 5.2 DidService

| Method | Behavior |
|---|---|
| `createDid(method='key')` | Generates key pair via `DidKeyProvider`, creates DID document, persists `Did` record with embedded `DidKey[]` |
| `resolveDid(did)` | Looks up `Did` by unique `did` field, returns `document` as `DidDocument` |
| `getKeyPair(did)` | Returns first key from `Did.keys[]` as `{ publicKey, privateKey, kid, algorithm }` |
| `getPublicKey(did)` | Resolves DID document, extracts `publicKeyJwk` from first `verificationMethod` |
| `listDids()` | Returns all DIDs with `{ did, method, active, createdAt }` |

Only `did:key` method is supported. Other methods throw `Error('Unsupported DID method')`.

---

## 6. Cryptographic Module

**Files:**
- `apps/api/src/modules/crypto/key-manager.service.ts`
- `apps/api/src/modules/crypto/crypto.service.ts`
- `apps/api/src/modules/crypto/sd-jwt.service.ts`

### 6.1 KeyManagerService

| Method | Implementation |
|---|---|
| `importPrivateKey(jwk)` | `jose.importJWK(jwk, 'ES256')` |
| `importPublicKey(jwk)` | Clones JWK, deletes `d` parameter, `jose.importJWK(publicJwk, 'ES256')` |
| `signJwt(payload, privateKeyJwk, header?)` | `new jose.SignJWT(payload).setProtectedHeader({ alg: 'ES256', ...header }).sign(key)` |
| `verifyJwt(jwt, publicKeyJwk)` | `jose.jwtVerify(jwt, publicKey, { algorithms: ['ES256'] })` -- algorithm locked to prevent substitution attacks |
| `calculateThumbprint(jwk)` | `jose.calculateJwkThumbprint(jwk, 'sha256')` |

### 6.2 CryptoService

Thin wrapper over `KeyManagerService`:

| Method | Implementation |
|---|---|
| `signJwt(payload, privateKeyJwk, header?)` | Delegates to `keyManager.signJwt()` |
| `verifyJwt(jwt, publicKeyJwk)` | Delegates to `keyManager.verifyJwt()`, returns `payload` only |
| `generateRandomString(length=32)` | `crypto.getRandomValues(new Uint8Array(length))` --> `base64url` encoding |
| `hashSha256(data)` | `crypto.createHash('sha256').update(data).digest()` --> `base64url` encoding |

### 6.3 SdJwtService

Builds `SDJwtVcInstance` from `@sd-jwt/sd-jwt-vc` with custom pluggable functions:

**Signer** (`createSigner(privateKeyJwk)`):
1. Receives `header.payload` as dot-separated base64url string.
2. Parses protected header from first segment.
3. Creates `jose.CompactSign` with payload bytes and parsed header.
4. Returns only the signature segment (third part of compact JWS).

**Verifier** (`createVerifier(publicKeyJwk)`):
1. Receives `data` (header.payload) and `signature` separately.
2. Reconstructs compact JWS as `data.signature`.
3. Calls `jose.compactVerify()` with the public key.
4. Returns `true` on success, `false` on any error.

**KB Verifier**: Same pattern as Verifier, used for key-binding JWT verification.

**Hasher**: `crypto.createHash('sha256').update(data).digest()` --> `Uint8Array`. Maps `sha-256` to `sha256` for Node crypto compatibility.

**Salt generator**: `crypto.randomBytes(16).toString('base64url')` -- 128 bits of entropy per disclosure.

#### issue(options: SdJwtIssueOptions): Promise<string>

Payload construction:

```typescript
{
  iss: issuerDid,        // Issuer DID
  sub: subjectDid,       // Subject DID
  vct: credentialType,   // Verifiable Credential Type URI
  iat: floor(now/1000),  // Issued-at (Unix seconds)
  exp?: floor(expiresAt/1000),  // Optional expiry
  cnf?: { jwk: holderPublicKey },  // Holder binding
  status?: { status_list: { idx, uri } },  // Revocation reference
  ...claims              // Credential-specific claims
}
```

Disclosure frame: `{ _sd: disclosableClaims }` -- array of claim keys to make selectively disclosable.

#### verify(sdJwtVc, issuerPublicKey, requiredClaims?): Promise<SdJwtVerifyResult>

Creates instance with public key verifier only, calls `instance.verify()`. Returns `{ valid, payload, disclosedClaims, error? }`.

#### present(options: SdJwtPresentOptions): Promise<string>

1. Creates instance with holder's private key as `kbSigner`.
2. Builds presentation frame: `{ claimKey: true }` for each disclosed claim.
3. Adds key binding JWT with `{ aud: audience, nonce, iat }`.
4. Returns the SD-JWT-VC with selected disclosures and appended KB-JWT.

#### decode(sdJwtVc): { header, payload, disclosures }

Manual parsing:
1. Split on `~` separator to get JWT and disclosures.
2. Split JWT on `.` to get header and payload segments.
3. Base64url-decode and JSON-parse each segment.

---

## 7. Issuer Module (OID4VCI)

**File:** `apps/api/src/modules/issuer/issuer.service.ts`

### 7.1 Issuer DID Management

`getOrCreateIssuerDid()`:
1. Check `ISSUER_DID` environment variable.
2. Query first active `did:key` DID from database (ordered by `createdAt asc`).
3. If none found, create a new DID via `DidService.createDid('key')`.

### 7.2 Issuer Metadata

`getIssuerMetadata()` returns an OID4VCI `.well-known/openid-credential-issuer` response:

```json
{
  "credential_issuer": "{baseUrl}",
  "credential_endpoint": "{baseUrl}/credential",
  "token_endpoint": "{baseUrl}/token",
  "credential_configurations_supported": {
    "{typeUri}": {
      "format": "vc+sd-jwt",
      "cryptographic_binding_methods_supported": ["did:key"],
      "credential_signing_alg_values_supported": ["ES256"],
      "credential_definition": { "type": ["{typeUri}"] },
      "display": [{ "name": "{schemaName}", "locale": "en-US" }]
    }
  }
}
```

Built dynamically from all active `CredentialSchema` records.

### 7.3 Credential Offer Flow

`createOffer(schemaTypeUri, subjectDid, claims, pinRequired=false)`:

1. Validate schema exists by `typeUri`.
2. Generate `preAuthorizedCode`: `randomBytes(32).toString('base64url')` -- 256 bits.
3. Create `CredentialOffer` record with status `pending`, expires in 10 minutes.
4. Build `openid-credential-offer://` URI with JSON-encoded offer payload containing `pre-authorized_code` grant.

### 7.4 Token Exchange

`exchangeToken(preAuthorizedCode, pin?)`:

1. Look up offer by `preAuthorizedCode` (unique index).
2. Reject if status is not `pending`.
3. Reject if expired (updates status to `expired`).
4. Reject if PIN required but not provided.
5. Generate `accessToken`: `randomBytes(32).toString('base64url')`.
6. Generate `c_nonce`: `randomBytes(16).toString('base64url')`.
7. Update offer status to `token_issued`.
8. Return `{ access_token, token_type: 'Bearer', expires_in: 300, c_nonce, c_nonce_expires_in: 300 }`.

### 7.5 Credential Issuance

`issueCredential(accessToken, format, credentialDefinition, proof?)`:

1. Look up offer by `accessToken`.
2. Reject if status is not `token_issued`.
3. Load schema by `offer.schemaTypeUri`.
4. Extract holder public key from `proof.jwt` header's `jwk` field (via `jose.decodeProtectedHeader()`).
5. Load issuer key pair via `DidService.getKeyPair(offer.issuerDid)`.
6. Call `SdJwtService.issue()` with claims, selectively-disclosable claim list from schema (`sdClaims`), and computed expiry.
7. Compute credential hash: `SHA-256(sdJwtVc)` stored as hex.
8. Create `IssuedCredential` record.
9. Update offer status to `credential_issued`, generate new `c_nonce`.
10. Return `{ credential: sdJwtVc, c_nonce, c_nonce_expires_in: 300 }`.

---

## 8. Wallet Module

**File:** `apps/api/src/modules/wallet/wallet.service.ts`

### 8.1 Holder DID Management

`createHolderDid(holderId, method='key')`:
- Creates DID via `DidService.createDid()`.
- Stores in `WalletDid` with `isPrimary: true` and full key data as JSON.

`getOrCreateHolderDid(holderId)`:
- Finds existing primary `WalletDid` for holder.
- Creates new if none exists.
- Returns `{ did, keyPair: { publicKey, privateKey } }`.

### 8.2 Credential Reception (OID4VCI Client)

`receiveCredential(credentialOfferUri, holderId)`:

1. **Parse offer URI** -- `Oid4vciClientService.parseOfferUri()` decodes the `credential_offer` query parameter.
2. **Token exchange** -- `Oid4vciClientService.exchangeCodeForToken(tokenEndpoint, preAuthCode)` via HTTP POST.
3. **Create holder proof** -- `Oid4vciClientService.createHolderProof()` builds JWT with:
   - Header: `{ alg: 'ES256', typ: 'openid4vci-proof+jwt', jwk: holderPublicJwk }`
   - Payload: `{ iss: holderDid, aud: credentialIssuer, nonce: c_nonce, iat }`
4. **Request credential** -- `Oid4vciClientService.requestCredential()` via HTTP POST with Bearer token.
5. **Decode and store** -- `SdJwtService.decode()` extracts payload; stored as `WalletCredential` with:
   - `rawCredential`: full SD-JWT-VC string
   - `sdClaims`: disclosure names extracted by base64url-decoding each disclosure and reading index `[1]`

### 8.3 Presentation Creation (OID4VP Client)

`createPresentation(verificationRequestId, holderId, selectedCredentials, disclosedClaims, consent)`:

1. Reject if `consent === false`.
2. Load `VerificationRequest` by ID.
3. For each selected credential:
   - Load `WalletCredential` from DB.
   - Call `SdJwtService.present()` with selective disclosure frame, nonce, audience (verifier DID), holder private key.
4. Build VP token: single SD-JWT-VC string if one credential, JSON array if multiple.
5. Record consent via `ConsentService.recordConsent()`.
6. Update verification request status to `received`.

---

## 9. Verifier Module (OID4VP)

**Files:**
- `apps/api/src/modules/verifier/verifier.service.ts`
- `apps/api/src/modules/verifier/validation-pipeline.service.ts`
- `apps/api/src/modules/verifier/policy-engine.service.ts`

### 9.1 Presentation Request

`VerifierService.createPresentationRequest(verifierDid, credentialTypes, requiredClaims?, policies?)`:

1. Generate `nonce`: `randomBytes(16).toString('base64url')`.
2. Generate `state`: `randomBytes(16).toString('base64url')`.
3. Build `presentation_definition` per OID4VP spec:
   ```json
   {
     "id": "pd-{state}",
     "input_descriptors": [{
       "id": "descriptor-{index}",
       "format": { "vc+sd-jwt": { "alg": ["ES256"] } },
       "constraints": {
         "fields": [
           { "path": ["$.vct"], "filter": { "type": "string", "const": "{type}" } },
           { "path": ["$.{claim}"] }
         ]
       }
     }]
   }
   ```
4. Default policies: `['require-trusted-issuer', 'require-active-status', 'require-non-expired']`.
5. Expires in 10 minutes.
6. Returns `openid4vp://` URI with `request_uri` and `nonce`.

### 9.2 Presentation Response Handling

`VerifierService.handlePresentationResponse(vpToken, state)`:

1. Look up `VerificationRequest` by `state` (unique index).
2. Delegate to `ValidationPipelineService.validatePresentation()`.
3. Update request status to `verified` or `rejected`, store result, set `completedAt`.

### 9.3 Validation Pipeline

`ValidationPipelineService.validatePresentation(vpToken, policies, nonce?)`:

Five sequential checks per credential in the VP token:

| Step | Check | Implementation |
|---|---|---|
| 1 | **Signature** | Resolve issuer DID --> get public key --> `SdJwtService.verify(sdJwtVc, issuerPublicKey)` |
| 2 | **Expiration** | Compare `payload.exp` against `Math.floor(Date.now() / 1000)` |
| 3 | **Status** | If `payload.status.status_list` exists, call `StatusService.checkStatus(uri, idx)` -- returns `false` if bit is set (revoked) |
| 4 | **Trust** | `TrustService.verifyTrust(issuerDid, credentialType)` -- checks issuer exists, is active, and is authorized for the credential type |
| 5 | **Policy** | `PolicyEngineService.evaluatePolicies(policies, context)` -- evaluates each named policy against aggregated check results |

If signature verification fails, the credential is skipped entirely (`continue`).

Result structure:

```typescript
interface ValidationResult {
  verified: boolean;  // all checks passed
  checks: {
    signature: { valid: boolean; error?: string };
    expiration: { valid: boolean; error?: string };
    status: { valid: boolean; error?: string };
    trust: { valid: boolean; error?: string };
    policy: { valid: boolean; error?: string };
  };
  credentials: ValidatedCredential[];  // disclosed claims per credential
}
```

### 9.4 Policy Engine

**File:** `apps/api/src/modules/verifier/policy-engine.service.ts`

`PolicyEngineService.evaluatePolicy(policyName, context)`:

| Policy Name | Evaluation |
|---|---|
| `require-trusted-issuer` | `context.trustResult.trusted` |
| `require-active-status` | `context.statusResult.valid` |
| `require-non-expired` | `context.expirationResult.valid` |
| (unknown) | Always returns `valid: true` |

`evaluatePolicies()` iterates all policy names and returns `{ allPassed: boolean, results: PolicyEvaluationResult[] }`.

---

## 10. Status Module (Bitstring Status List)

**Files:**
- `apps/api/src/modules/status/bitstring-status-list.service.ts`
- `apps/api/src/modules/status/status.service.ts`

### 10.1 BitstringStatusListService

W3C Bitstring Status List v2 implementation:

| Method | Algorithm |
|---|---|
| `createEmptyList(size=131072)` | Allocates `Uint8Array(ceil(size/8))` of zeros, encodes via `encode()` |
| `encode(bitstring)` | `pako.gzip(bitstring)` --> `Buffer.from(compressed).toString('base64url')` |
| `decode(encodedList)` | `Buffer.from(encodedList, 'base64url')` --> `pako.ungzip()` --> `Uint8Array` |
| `getBit(encodedList, index)` | `byteIndex = floor(index/8)`, `bitIndex = index%8`, `mask = 1 << (7 - bitIndex)` -- big-endian bit ordering |
| `setBit(encodedList, index, value)` | Decode, apply OR (set) or AND-NOT (clear) mask, re-encode |

Default list size: 131,072 bits (16 KB uncompressed, configurable via `STATUS_LIST_SIZE`).

### 10.2 StatusService

| Method | Behavior |
|---|---|
| `getOrCreateStatusList(issuerDid, purpose='revocation')` | Finds or creates a `StatusList` record for the issuer |
| `allocateIndex(issuerDid)` | Returns `{ statusListId, index }`, increments `currentIndex` atomically |
| `revokeCredential(credentialId)` | Sets bit to `true` in the bitstring, updates credential status to `revoked` |
| `suspendCredential(credentialId)` | Updates credential status to `suspended` (does NOT modify the bitstring) |
| `reinstateCredential(credentialId)` | Sets bit to `false` in the bitstring, updates credential status to `active` |
| `checkStatus(statusListUri, index)` | Extracts list ID from URI, calls `getBit()`, returns `true` if bit is NOT set (active) |
| `getStatusList(id)` | Returns W3C `BitstringStatusListCredential` JSON-LD envelope |

Status list credential format:

```json
{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "type": ["VerifiableCredential", "BitstringStatusListCredential"],
  "issuer": "{issuerDid}",
  "credentialSubject": {
    "type": "BitstringStatusList",
    "statusPurpose": "revocation",
    "encodedList": "{gzipped-base64url}"
  }
}
```

---

## 11. Trust Module

**File:** `apps/api/src/modules/trust/trust.service.ts`

### 11.1 TrustService

| Method | Behavior |
|---|---|
| `registerIssuer(did, name, credentialTypes, description?)` | Creates `TrustedIssuer` record. Throws `ConflictException` if DID already registered. |
| `listIssuers()` | Returns all trusted issuers ordered by `createdAt desc`. |
| `getIssuer(did)` | Returns `{ trusted: boolean, issuer }`. Trusted if status is `active`. |
| `updateIssuer(did, updates)` | Partial update of name, credentialTypes, status. Throws `NotFoundException` if not found. |
| `removeIssuer(did)` | Deletes `TrustedIssuer` record. |
| `verifyTrust(issuerDid, credentialType)` | Three-check verification (see below). |

`verifyTrust()` logic:

1. Look up issuer by DID. If not found: `{ trusted: false, reason: 'Issuer not found in trust registry' }`.
2. Check `issuer.status === 'active'`. If not: `{ trusted: false, reason: 'Issuer status is {status}' }`.
3. Check `issuer.credentialTypes.includes(credentialType)`. If not: `{ trusted: false, reason: 'Issuer not authorized to issue {type}' }`.
4. All checks pass: `{ trusted: true }`.

---

## 12. Middleware and Cross-Cutting Concerns

### 12.1 CorrelationIdMiddleware

**File:** `apps/api/src/common/middleware/correlation-id.middleware.ts`

- Reads `x-correlation-id` from request headers.
- If absent, generates `crypto.randomUUID()`.
- Sets the correlation ID on both request headers and response headers.
- Applied to all routes via `consumer.apply(...).forRoutes('*')`.

### 12.2 LoggingMiddleware

**File:** `apps/api/src/common/middleware/logging.middleware.ts`

Logs on `res.finish` event:

```
{method} {originalUrl} {statusCode} {contentLength}b {duration}ms [{correlationId}] {ip} "{userAgent}"
```

Log level selection:
- `statusCode >= 500` --> `logger.error()`
- `statusCode >= 400` --> `logger.warn()`
- Otherwise --> `logger.log()`

### 12.3 AllExceptionsFilter

**File:** `apps/api/src/common/filters/http-exception.filter.ts`

Catches all exceptions (`@Catch()` with no arguments). Error classification:

| Exception Type | Detection | HTTP Status | Error Code |
|---|---|---|---|
| `HttpException` | `instanceof HttpException` | From exception | From exception response |
| Mongoose duplicate key | `error.code === 11000` (MongoServerError) | 409 Conflict | Unique constraint violation |
| Mongoose not found | Document is `null` after query | 404 Not Found | Record not found |
| Mongoose validation | `error.name === 'ValidationError'` | 400 Bad Request | Invalid request data |
| Malformed ObjectID | `message.includes('Malformed ObjectID')` | 400 Bad Request | Invalid ID format |
| Generic Error | `instanceof Error` | 500 (dev shows message, prod hides) | Internal server error |

Response shape:

```json
{
  "success": false,
  "statusCode": 400,
  "error": "BadRequest",
  "message": "...",
  "timestamp": "2026-03-31T...",
  "path": "/issuer/offers"
}
```

### 12.4 ResponseInterceptor

**File:** `apps/api/src/common/interceptors/response.interceptor.ts`

Wraps all successful responses via RxJS `map()` operator:

```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "timestamp": "2026-03-31T..."
}
```

If the controller already returns an object with a `data` property, the interceptor spreads it (avoids double-nesting).

---

## 13. Testing Strategy

### 13.1 Framework

- **Test runner:** Vitest 1.x (configured per workspace).
- **HTTP testing:** Supertest 6.x (for E2E).
- **Build:** SWC via `unplugin-swc` for fast test compilation.

### 13.2 Test Scripts

```bash
pnpm test          # vitest run (unit tests)
pnpm test:watch    # vitest in watch mode
pnpm test:e2e      # vitest run --config vitest.e2e.config.ts
```

### 13.3 Mocking Strategy

All unit tests mock external dependencies:

- `Mongoose Models`: Each Mongoose model method (`findOne`, `create`, `find`, `findByIdAndUpdate`, `findByIdAndDelete`) is replaced with `vi.fn()`.
- `JwtService`: `signAsync()` and `verifyAsync()` mocked with deterministic return values.
- `ConfigService`: `get()` mocked to return test configuration values.
- Module services: cross-module dependencies (e.g., `DidService` in `IssuerService`) are mocked at the service level.

No tests require a live MongoDB connection. All database interactions are mocked.

---

## 14. Security Considerations

### 14.1 Cryptographic Choices

| Concern | Algorithm / Parameter | Rationale |
|---|---|---|
| Credential signing | ES256 (P-256 ECDSA) | HAIP (High Assurance Interoperability Profile) compliance |
| Password hashing | bcrypt, 12 salt rounds | Industry standard, cost factor prevents brute force |
| API key hashing | SHA-256 (hex output) | One-way; raw key never stored |
| Refresh token hashing | SHA-256 (hex output) | Prevents DB compromise from leaking tokens |
| JWK thumbprint | SHA-256 | Per RFC 7638 |
| SD-JWT disclosure hashing | SHA-256 | Per SD-JWT specification |
| Salt generation | `crypto.randomBytes(16)` (128 bits) | Per SD-JWT specification recommendation |
| JWT algorithm lock | `{ algorithms: ['ES256'] }` on `jwtVerify()` | Prevents algorithm substitution attacks |

### 14.2 Authentication Security

- Access tokens: 15-minute expiry, HS256 signed.
- Refresh tokens: 7-day expiry with rotation. Reuse detection invalidates entire token family.
- API keys: `tvk_` prefix + 64 hex characters (256 bits entropy). Stored as SHA-256 hash only.

### 14.3 Transport and Application Security

- **Helmet**: security headers including `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security` (with `crossOriginResourcePolicy: 'cross-origin'`).
- **Rate limiting**: 60 requests per 60 seconds per IP (`ThrottlerModule`).
- **Input validation**: `ValidationPipe` with `whitelist: true` strips unknown properties; `forbidNonWhitelisted: true` rejects them.
- **Mongoose**: parameterized queries by design (no raw query injection vector).
- **Error masking**: production mode hides internal error messages; development mode exposes them.
- **No sensitive data in logs**: credential claim values and private keys are never logged. Only DIDs, credential IDs, and types appear in logs.
- **CORS**: configurable origin, defaults to `*` for development.

---

## 15. Configuration Reference

| Variable | Description | Default | Required |
|---|---|---|---|
| `PORT` | HTTP listen port | `8000` | No |
| `NODE_ENV` | Environment mode (`development`, `production`) | `development` | No |
| `DATABASE_URL` | MongoDB Atlas connection string | -- | **Yes** |
| `CORS_ORIGIN` | Allowed CORS origin | `*` | No |
| `DEFAULT_DID_METHOD` | DID method for new DIDs | `key` | No |
| `DEFAULT_CREDENTIAL_FORMAT` | Credential format | `sd-jwt-vc` | No |
| `DEFAULT_CREDENTIAL_EXPIRY_DAYS` | Days until credential expiry | `365` | No |
| `STATUS_LIST_SIZE` | Bits in each status list | `131072` | No |
| `JWT_SECRET` | Secret for HS256 auth JWT signing | `trustilock-dev-secret-change-in-production` | **Yes (production)** |
| `JWT_ACCESS_EXPIRY` | Access token lifetime | `15m` | No |
| `JWT_REFRESH_EXPIRY` | Refresh token lifetime | `7d` | No |
| `ISSUER_DID` | Pre-configured issuer DID | (auto-created) | No |
| `ISSUER_BASE_URL` | Base URL for OID4VCI endpoints | `http://localhost:{PORT}/issuer` | No |
