# TrustiLock — Full Execution Plan

## Milestone-Based Prototype | Mongoose + MongoDB | Zero Budget

> **Scope:** Backend APIs, data models, protocol flows, testing, Docker deployment.
> **Out of Scope:** UI/UX design and frontend implementation (handled separately).
> **Budget:** $0 — all tools and libraries are free and open source.

---

## 0. Manual TODOs & Human Decisions

> Every item below needs **your action** — these cannot be automated.

### Before Starting (One-Time Setup)

| # | TODO | Action Required | When |
|---|---|---|---|
| 1 | **Install Node.js 20 LTS** | Download from nodejs.org and install | Before M1 |
| 2 | **Install Docker Desktop** | Download from docker.com and install. Ensure Docker Compose v2 is available (`docker compose version`) | Before M1 |
| 3 | **Install Git** | Ensure `git --version` works | Before M1 |
| 4 | **Create GitHub repo** | Go to GitHub → New repository → name it `trustilock` (public or private). Clone it locally. | Before M1 |
| 5 | **Create MongoDB Atlas cluster** | Go to [mongodb.com/atlas](https://mongodb.com/atlas) → Sign up (free) → Create free cluster (M0, 512MB) → Create database user → Whitelist your IP (or allow `0.0.0.0/0` for dev) → Get connection string. | Before M1 |
| 6 | **Create `.env` file** | Copy `.env.example` → `.env`. Paste your Atlas connection string in `DATABASE_URL` (format: `mongodb+srv://user:pass@cluster.mongodb.net/trustilock`). | Before M1 |

### Decisions (Already Finalized)

| # | Decision | Choice |
|---|---|---|
| 7 | **Credential types** | Education + Income + Identity (3 types) |
| 8 | **E2E use case** | Loan Processing (multi-issuer, multi-credential) |
| 9 | **Trusted issuers** | TrustBank India (income), National Technical University (education), Digital Identity Authority (identity) |
| 10 | **Untrusted issuer** | QuickDegree Online (for rejection demo) |
| 11 | **Verifier** | HomeFirst Finance (loan company) |
| 12 | **Policies** | `require-trusted-issuer`, `require-active-status`, `require-non-expired` |
| 13 | **Selective disclosure** | Always disclosed: institution, currency, country. Holder's choice: name, income, degree, GPA, DOB, employer |

### After Development (Demo Prep)

| # | TODO | Action Required | When |
|---|---|---|---|
| 12 | **Test Docker Compose startup** | Run `docker compose up --build` and verify API starts and connects to Atlas. Check `http://localhost:3000/api/docs` loads Swagger. | After M6 |
| 13 | **Import Postman collection** | Open Postman → Import → select `docs/postman/TrustiLock.postman_collection.json`. Set environment variable `baseUrl=http://localhost:3000`. | After M6 |
| 14 | **Run demo walkthrough manually** | Execute the Postman collection in order: seed → issue → receive → verify → revoke → re-verify. Confirm all responses are correct. | After M6 |
| 15 | **Prepare demo script** | Write a 5-minute narrative for your presentation: who are the actors (bank, university, loan company, user), what happens at each step, what the verification result shows. | After M6 |
| 16 | **Screenshot key responses** | Capture Swagger UI, issuance response, verification result (with checks), revocation result for slides/docs. | After M6 |

### If Deploying Beyond Localhost

| # | TODO | Action Required | When |
|---|---|---|---|
| 17 | **Choose free hosting (optional)** | If you need a public URL for demo: **Railway.app** (free tier, $5 credit), **Render.com** (free tier), or **Fly.io** (free tier). All support Docker. | Optional |
| 18 | **Set up domain for did:web (optional)** | If using did:web: you need a domain. Free options: GitHub Pages, Vercel, Netlify — host `/.well-known/did.json`. Otherwise stick with did:key (no domain needed). | Optional |
| 19 | **MongoDB Atlas IP whitelist** | If deploying to a cloud host: add the host's IP to Atlas Network Access whitelist. For dev, `0.0.0.0/0` works but restrict in production. | Optional |

### Ongoing Decisions (If Extending)

| # | TODO | Action Required | When |
|---|---|---|---|
| 20 | **Add more credential types?** | Each new type needs: schema definition, seed data, trust registry entry. ~30 min per type. | Post-prototype |
| 21 | **Add more use cases?** | Each E2E use case needs: issuer setup, credential types, verification policies, test scenario. ~1-2 hours per use case. | Post-prototype |
| 22 | **Connect to UI/UX?** | When frontend is ready: it will consume the same REST APIs. Share the Swagger spec (`/api/docs`) with the frontend team. CORS origins need to be updated in config. | Post-prototype |
| 23 | **Onboard real organizations?** | See [`TRUSTILOCK_ONBOARDING.md`](./TRUSTILOCK_ONBOARDING.md) — full process: application → verification → legal agreement → DID setup → testing → certification → go-live. Timeline: 6-10 weeks per issuer. | Post-prototype |

---

## 1. Project Structure

### 1.1 Monorepo Layout

```
trustilock/
├── apps/
│   └── api/                           # Single NestJS application
│       ├── src/
│       │   ├── modules/
│       │   │   ├── did/               # DID creation & resolution
│       │   │   │   ├── did.module.ts
│       │   │   │   ├── did.service.ts
│       │   │   │   ├── did.controller.ts (optional, mostly internal)
│       │   │   │   └── providers/
│       │   │   │       ├── did-key.provider.ts
│       │   │   │       └── did-web.provider.ts
│       │   │   │
│       │   │   ├── crypto/            # SD-JWT, JWT, key management
│       │   │   │   ├── crypto.module.ts
│       │   │   │   ├── crypto.service.ts
│       │   │   │   ├── sd-jwt.service.ts
│       │   │   │   └── key-manager.service.ts
│       │   │   │
│       │   │   ├── issuer/            # OID4VCI endpoints
│       │   │   │   ├── issuer.module.ts
│       │   │   │   ├── issuer.service.ts
│       │   │   │   ├── issuer.controller.ts
│       │   │   │   ├── dto/
│       │   │   │   │   ├── create-offer.dto.ts
│       │   │   │   │   ├── token-request.dto.ts
│       │   │   │   │   └── credential-request.dto.ts
│       │   │   │   └── schemas/       # Credential type definitions
│       │   │   │       ├── education-credential.ts
│       │   │   │       └── income-credential.ts
│       │   │   │
│       │   │   ├── wallet/            # Wallet backend
│       │   │   │   ├── wallet.module.ts
│       │   │   │   ├── wallet.service.ts
│       │   │   │   ├── wallet.controller.ts
│       │   │   │   ├── oid4vci-client.service.ts
│       │   │   │   ├── oid4vp-client.service.ts
│       │   │   │   └── consent.service.ts
│       │   │   │
│       │   │   ├── verifier/          # OID4VP endpoints
│       │   │   │   ├── verifier.module.ts
│       │   │   │   ├── verifier.service.ts
│       │   │   │   ├── verifier.controller.ts
│       │   │   │   ├── validation-pipeline.service.ts
│       │   │   │   └── policy-engine.service.ts
│       │   │   │
│       │   │   ├── trust/             # Trust registry
│       │   │   │   ├── trust.module.ts
│       │   │   │   ├── trust.service.ts
│       │   │   │   └── trust.controller.ts
│       │   │   │
│       │   │   └── status/            # Credential status / revocation
│       │   │       ├── status.module.ts
│       │   │       ├── status.service.ts
│       │   │       ├── status.controller.ts
│       │   │       └── bitstring-status-list.service.ts
│       │   │
│       │   ├── common/
│       │   │   ├── types/             # Shared TypeScript types
│       │   │   ├── constants/         # Credential types, DID methods
│       │   │   ├── decorators/        # Custom NestJS decorators
│       │   │   └── filters/           # Exception filters
│       │   │
│       │   ├── config/
│       │   │   └── configuration.ts   # App configuration
│       │   │
│       │   ├── app.module.ts
│       │   └── main.ts
│       │
│       ├── src/database/
│       │   └── schemas/               # Mongoose schemas
│       │
│       ├── test/
│       │   ├── unit/                  # Unit tests
│       │   ├── integration/           # API integration tests
│       │   └── e2e/                   # End-to-end scenarios
│       │       ├── credential-issuance.e2e.ts
│       │       ├── proof-presentation.e2e.ts
│       │       ├── trust-enforcement.e2e.ts
│       │       ├── revocation.e2e.ts
│       │       └── loan-processing.e2e.ts
│       │
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                        # Shared types & utilities
│       ├── src/
│       │   ├── types/                 # VC, DID, OID4VC type definitions
│       │   ├── constants.ts           # Credential types, supported formats
│       │   └── utils.ts               # Common helpers
│       └── package.json
│
├── infrastructure/
│   ├── docker-compose.yml             # API app (MongoDB is Atlas cloud)
│   └── seed/
│       ├── seed-issuers.ts            # Pre-configured trusted issuers
│       ├── seed-schemas.ts            # Credential schema definitions
│       └── seed-trust.ts              # Trust registry entries
│
├── docs/
│   └── postman/
│       └── TrustiLock.postman_collection.json
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .eslintrc.js
├── .prettierrc
├── .env.example
└── .gitignore
```

### 1.2 Dependencies (package.json)

```json
{
  "dependencies": {
    "@nestjs/core": "^10.0.0",
    "@nestjs/common": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/swagger": "^7.0.0",
    "mongoose": "^8.0.0",

    "@veramo/core": "^6.0.0",
    "@veramo/did-manager": "^6.0.0",
    "@veramo/did-provider-key": "^6.0.0",
    "@veramo/did-resolver": "^6.0.0",
    "@veramo/key-manager": "^6.0.0",
    "@veramo/kms-local": "^6.0.0",
    "@veramo/credential-w3c": "^6.0.0",

    "@sphereon/oid4vci-common": "^0.12.0",
    "@sphereon/oid4vci-issuer": "^0.12.0",
    "@sphereon/oid4vci-client": "^0.12.0",
    "@sphereon/did-auth-siop": "^0.12.0",
    "@sphereon/pex": "^4.0.0",
    "@sphereon/ssi-types": "^0.24.0",

    "@sd-jwt/core": "^0.7.0",
    "@sd-jwt/sd-jwt-vc": "^0.7.0",
    "jose": "^5.0.0",

    "did-resolver": "^4.1.0",
    "key-did-resolver": "^4.0.0",
    "web-did-resolver": "^2.0.0",

    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0",
    "qrcode": "^1.5.0",
    "pako": "^2.1.0"
  },
  "devDependencies": {
    "@types/mongoose": "^5.0.0",
    "vitest": "^1.0.0",
    "supertest": "^6.0.0",
    "typescript": "^5.4.0",
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0"
  }
}
```

---

## 2. Data Models (Mongoose + MongoDB)

### 2.1 Mongoose Schemas

Mongoose schemas are defined in `apps/api/src/database/schemas/`. Each model is a TypeScript class decorated with `@Schema()` and registered via `MongooseModule.forFeature()`.

```typescript
// Connection configured in DatabaseModule
// DATABASE_URL from environment points to MongoDB Atlas

// ============================================
// DID Management
// ============================================

model Did {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  did       String   @unique
  method    String   // "key", "web", "jwk"
  document  Json     // Full DID document
  keys      DidKey[]
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("dids")
}

type DidKey {
  kid          String   // Key identifier
  type         String   // "ES256", "Ed25519"
  publicKeyJwk Json     // Public key in JWK format
  privateKeyJwk Json?   // Private key (encrypted, prototype only)
  purposes     String[] // ["authentication", "assertionMethod"]
}

// ============================================
// Issuer Service
// ============================================

model CredentialSchema {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  typeUri     String   @unique  // e.g., "VerifiableEducationCredential"
  name        String
  description String?
  schema      Json     // JSON Schema for credential claims
  sdClaims    String[] // Claims that support selective disclosure
  display     Json?    // Display metadata (name, logo, colors)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@map("credential_schemas")
}

model CredentialOffer {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  issuerDid         String
  schemaTypeUri     String
  preAuthorizedCode String   @unique
  pinRequired       Boolean  @default(false)
  pinHash           String?
  claims            Json     // Pre-filled claim values to issue
  accessToken       String?  // Generated after code exchange
  cNonce            String?  // Challenge nonce for proof
  status            String   @default("pending") // pending, token_issued, credential_issued, expired
  expiresAt         DateTime
  createdAt         DateTime @default(now())

  @@map("credential_offers")
}

model IssuedCredential {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  issuerDid       String
  subjectDid      String
  schemaTypeUri   String
  credentialHash  String   @unique // Hash of the credential for tracking
  statusListId    String?  // Reference to status list
  statusListIndex Int?     // Bit position in status list
  status          String   @default("active") // active, revoked, suspended
  expiresAt       DateTime?
  issuedAt        DateTime @default(now())
  metadata        Json?

  @@index([issuerDid])
  @@index([subjectDid])
  @@index([status])
  @@map("issued_credentials")
}

// ============================================
// Status Service (Revocation)
// ============================================

model StatusList {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  issuerDid    String
  purpose      String   @default("revocation") // revocation, suspension
  encodedList  String   // Base64-encoded GZIP'd bitstring
  currentIndex Int      @default(0)
  size         Int      @default(131072) // 16KB = 131072 bits
  publishedUrl String?  // URL where this list is served
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([issuerDid])
  @@map("status_lists")
}

// ============================================
// Trust Registry
// ============================================

model TrustedIssuer {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  did             String   @unique
  name            String
  description     String?
  logoUrl         String?
  website         String?
  credentialTypes String[] // Credential type URIs this issuer can issue
  status          String   @default("active") // active, suspended, revoked
  registeredBy    String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("trusted_issuers")
}

model TrustPolicy {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String   @unique
  description String?
  rules       Json     // Policy rules in JSON format
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@map("trust_policies")
}

// ============================================
// Wallet
// ============================================

model WalletCredential {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  holderId       String   // Wallet owner identifier
  rawCredential  String   // The actual SD-JWT-VC string
  format         String   // "sd-jwt-vc", "jwt-vc"
  credentialType String   // Credential type URI
  issuerDid      String
  claims         Json     // Decoded claims (for listing/search)
  sdClaims       String[] // Which claims are selectively disclosable
  issuedAt       DateTime
  expiresAt      DateTime?
  metadata       Json?    // Display info, issuer name, etc.
  createdAt      DateTime @default(now())

  @@index([holderId])
  @@index([credentialType])
  @@map("wallet_credentials")
}

model WalletDid {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  holderId  String
  did       String   @unique
  method    String   // "key", "jwk"
  keyData   Json     // Key pair data (prototype: stored directly)
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([holderId])
  @@map("wallet_dids")
}

model ConsentRecord {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  holderId        String
  verifierDid     String
  verifierName    String?
  credentialIds   String[] // Wallet credential IDs presented
  disclosedClaims Json     // Which claims were disclosed
  purpose         String?
  consentGivenAt  DateTime @default(now())

  @@index([holderId])
  @@map("consent_records")
}

// ============================================
// Verifier
// ============================================

model VerificationRequest {
  id                     String   @id @default(auto()) @map("_id") @db.ObjectId
  verifierDid            String
  presentationDefinition Json     // DIF Presentation Exchange definition
  nonce                  String   @unique
  state                  String   @unique
  callbackUrl            String?
  requiredCredentialTypes String[]
  policies               String[] // Policy names to evaluate
  status                 String   @default("pending") // pending, received, verified, rejected, expired
  result                 Json?    // Verification result details
  expiresAt              DateTime
  createdAt              DateTime @default(now())
  completedAt            DateTime?

  @@map("verification_requests")
}

model VerifierPolicy {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String   @unique
  description String?
  rules       Json     // Policy rules
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@map("verifier_policies")
}

// ============================================
// Audit Log
// ============================================

model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  action    String   // CREDENTIAL_ISSUED, CREDENTIAL_VERIFIED, etc.
  actorDid  String
  targetId  String
  details   Json?
  timestamp DateTime @default(now())

  @@index([actorDid])
  @@index([action])
  @@index([timestamp])
  @@map("audit_logs")
}
```

---

## 3. API Contracts

### 3.1 Issuer APIs

```yaml
# OID4VCI Protocol Endpoints
GET  /issuer/.well-known/openid-credential-issuer
  → Returns: IssuerMetadata { credential_configurations_supported, credential_endpoint, token_endpoint }

POST /issuer/offers
  → Body: { schemaTypeUri, subjectDid, claims: { name, degree, ... }, pinRequired? }
  → Returns: { offerId, credentialOfferUri, qrCodeDataUrl }

POST /issuer/token
  → Body: { grant_type: "urn:ietf:params:oauth:grant-type:pre-authorized_code",
             pre_authorized_code, pin? }
  → Returns: { access_token, token_type: "Bearer", expires_in, c_nonce, c_nonce_expires_in }

POST /issuer/credential
  → Headers: Authorization: Bearer <access_token>
  → Body: { format: "vc+sd-jwt", credential_definition: { type }, proof: { proof_type: "jwt", jwt } }
  → Returns: { credential: "<sd-jwt-vc-string>", c_nonce }

# Management APIs
GET  /issuer/schemas                   → List credential schemas
GET  /issuer/schemas/:id               → Get schema details
GET  /issuer/credentials               → List issued credentials
POST /issuer/credentials/:id/revoke    → Revoke credential
```

### 3.2 Wallet APIs

```yaml
POST /wallet/credentials/receive
  → Body: { credentialOfferUri, holderId }
  → Returns: { credentialId, type, issuerDid, claims, issuedAt }

GET  /wallet/credentials?holderId=xxx
  → Returns: { credentials: [...], total }

GET  /wallet/credentials/:id
  → Returns: { id, type, issuer, claims, sdClaims, issuedAt, expiresAt }

GET  /wallet/credentials/:id/claims
  → Returns: { disclosed: [...], undisclosed: [...] }

DELETE /wallet/credentials/:id
  → Returns: { deleted: true }

POST /wallet/presentations/create
  → Body: { verificationRequestId, holderId, selectedCredentials, disclosedClaims, consent: true }
  → Returns: { presentationId, vpToken, status }

GET  /wallet/consent/history?holderId=xxx
  → Returns: { records: [...] }

POST /wallet/dids
  → Body: { holderId, method: "key" }
  → Returns: { did, method, createdAt }
```

### 3.3 Verifier APIs

```yaml
POST /verifier/presentations/request
  → Body: { verifierDid, credentialTypes, requiredClaims?, policies? }
  → Returns: { requestId, authorizationRequestUri, qrCodeDataUrl, nonce }

POST /verifier/presentations/response
  → Body: { vp_token, presentation_submission, state }
  → Returns: { verificationId, status, result }

GET  /verifier/presentations/:id
  → Returns: { status, result: { verified, checks: { signature, expiration, status, trust, policy }, credentials } }

POST /verifier/policies
  → Body: { name, description, rules }
  → Returns: { id, name, active }

GET  /verifier/policies
  → Returns: { policies: [...] }
```

### 3.4 Trust Registry APIs

```yaml
GET  /trust/issuers
  → Returns: { issuers: [...] }

GET  /trust/issuers/:did
  → Returns: { trusted: boolean, issuer: { name, did, status, credentialTypes } }

POST /trust/issuers
  → Body: { did, name, credentialTypes, description? }
  → Returns: { id, did, name, status: "active" }

PUT  /trust/issuers/:did
  → Body: { name?, credentialTypes?, status? }
  → Returns: { updated: true }

DELETE /trust/issuers/:did
  → Returns: { removed: true }

GET  /trust/verify?issuerDid=xxx&credentialType=yyy
  → Returns: { trusted: boolean, reason? }
```

### 3.5 Status APIs

```yaml
GET  /status/lists/:id
  → Returns: BitstringStatusListCredential (W3C format)

POST /status/revoke
  → Body: { credentialId, reason? }
  → Returns: { revoked: true, updatedAt }

POST /status/suspend
  → Body: { credentialId, reason? }
  → Returns: { suspended: true, updatedAt }

POST /status/reinstate
  → Body: { credentialId }
  → Returns: { reinstated: true, updatedAt }
```

---

## 4. Core Protocol Flows

### 4.1 OID4VCI Issuance Flow

```
Step 1: Issuer creates offer
  POST /issuer/offers { schemaTypeUri: "VerifiableEducationCredential", claims: { degree: "MSc" } }
  → Returns credential offer URI + QR code

Step 2: Wallet receives offer
  POST /wallet/credentials/receive { credentialOfferUri: "openid-credential-offer://..." }

  Internally:
  a) Parse offer → extract credential_issuer + pre-authorized_code
  b) Fetch issuer metadata (GET /.well-known/openid-credential-issuer)
  c) Exchange code for token (POST /issuer/token)
  d) Generate holder key proof (JWT signed by holder's did:key)
  e) Request credential (POST /issuer/credential with proof)
  f) Receive SD-JWT-VC → store in MongoDB

  → Returns stored credential details
```

### 4.2 OID4VP Verification Flow

```
Step 1: Verifier creates request
  POST /verifier/presentations/request {
    verifierDid: "did:key:z6Mk...",
    credentialTypes: ["VerifiableEducationCredential"],
    requiredClaims: { education: ["degree", "institution"] },
    policies: ["require-trusted-issuer"]
  }
  → Returns authorization request URI + QR code

Step 2: Wallet creates presentation
  POST /wallet/presentations/create {
    verificationRequestId: "req-123",
    holderId: "user-1",
    selectedCredentials: ["cred-id-1"],
    disclosedClaims: { "cred-id-1": ["degree", "institution"] },
    consent: true
  }

  Internally:
  a) Fetch verification request details
  b) Retrieve selected credentials from wallet store
  c) Build SD-JWT-VC with only requested disclosures
  d) Create Key Binding JWT (holder proof, includes nonce + aud)
  e) Submit VP Token to verifier response endpoint

  → Returns presentation status

Step 3: Verifier validates (automatic after response received)
  Validation Pipeline:
  1. Parse SD-JWT-VC → issuer JWT + disclosures + KB-JWT
  2. Resolve issuer DID → extract public key
  3. Verify issuer signature on SD-JWT
  4. Verify KB-JWT signature (holder binding)
  5. Check credential expiration
  6. Fetch Bitstring Status List → check revocation
  7. Query Trust Registry → is issuer trusted?
  8. Evaluate verifier policies
  9. Return verification report
```

### 4.3 SD-JWT-VC Structure

```
SD-JWT-VC = <Issuer-JWT>~<Disclosure1>~<Disclosure2>~...~<KB-JWT>

Issuer JWT payload:
{
  "iss": "did:key:z6Mk...",            // Issuer DID
  "sub": "did:key:z6Mk...",            // Subject/Holder DID
  "iat": 1711800000,
  "exp": 1743336000,
  "vct": "VerifiableEducationCredential",
  "status": {
    "status_list": { "idx": 42, "uri": "http://localhost:3000/status/lists/abc" }
  },
  "cnf": { "jwk": { ... } },           // Holder's public key (key binding)
  "_sd": [ "hash1", "hash2", "hash3" ],// Hashes of selectively disclosable claims
  "_sd_alg": "sha-256"
}

Disclosures (base64url JSON arrays):
  ["salt1", "name", "John Doe"]
  ["salt2", "degree", "MSc Computer Science"]
  ["salt3", "institution", "MIT"]

Key Binding JWT (created by holder at presentation):
{
  "typ": "kb+jwt",
  "alg": "ES256"
}
{
  "iat": 1711800100,
  "aud": "did:key:z6Mk...",            // Verifier's DID
  "nonce": "abc123",                    // From verification request
  "sd_hash": "..."                      // Hash of presented SD-JWT
}
```

### 4.4 Bitstring Status List

```
Published at GET /status/lists/:id:

{
  "@context": ["https://www.w3.org/ns/credentials/v2"],
  "id": "http://localhost:3000/status/lists/abc",
  "type": ["VerifiableCredential", "BitstringStatusListCredential"],
  "issuer": "did:key:z6Mk...",
  "validFrom": "2026-03-30T00:00:00Z",
  "credentialSubject": {
    "type": "BitstringStatusList",
    "statusPurpose": "revocation",
    "encodedList": "H4sIAAAAAAAAA-3B..."  // GZIP + Base64 bitstring
  }
}

Revocation check:
  1. Fetch status list from credential's status.status_list.uri
  2. Decode: Base64 → GZIP decompress → bitstring
  3. Check bit at position status.status_list.idx
  4. Bit = 1 → REVOKED | Bit = 0 → ACTIVE
```

---

## 5. Security (Prototype Scope)

### 5.1 What We Implement

| Security Measure | Status | Implementation |
|---|---|---|
| SD-JWT signature verification | Implemented | ES256 (P-256) via panva/jose |
| Holder Key Binding (KB-JWT) | Implemented | Verify cnf key + nonce + aud |
| Replay prevention (nonce) | Implemented | Unique nonce per verification request |
| Input validation | Implemented | class-validator on all DTOs |
| Credential expiration check | Implemented | Verify exp claim |
| Revocation check | Implemented | Bitstring Status List |
| Trust enforcement | Implemented | Trust registry lookup |
| CORS | Implemented | Configured per environment |
| Audit logging | Implemented | MongoDB audit_logs collection |

### 5.2 What We Defer (Production Upgrades)

| Security Measure | Why Deferred |
|---|---|
| DPoP tokens | HAIP requirement, adds complexity |
| Wallet attestation | Requires certification infrastructure |
| mTLS between services | Single monolith, not needed |
| HSM key storage | Costs money |
| Credential encryption at rest | Prototype scope |
| Rate limiting | Not needed for demo |
| Security scanning (Snyk/Trivy) | Production concern |

---

## 6. Testing Strategy

### 6.1 Mandatory Test Scenarios

```typescript
// test/e2e/01-credential-issuance.e2e.ts
describe("Scenario 1: Credential Issuance (< 5 seconds)", () => {
  it("should issue SD-JWT-VC via OID4VCI within 5 seconds", async () => {
    const start = Date.now();

    // 1. Create credential offer
    const offer = await request(app).post("/issuer/offers").send({
      schemaTypeUri: "VerifiableEducationCredential",
      subjectDid: holderDid,
      claims: { name: "John Doe", degree: "MSc", institution: "MIT" },
    });

    // 2. Wallet receives credential
    const credential = await request(app).post("/wallet/credentials/receive").send({
      credentialOfferUri: offer.body.credentialOfferUri,
      holderId: "user-1",
    });

    expect(Date.now() - start).toBeLessThan(5000);
    expect(credential.body.format).toBe("sd-jwt-vc");
    expect(credential.body.issuerDid).toBeDefined();
  });
});

// test/e2e/02-proof-presentation.e2e.ts
describe("Scenario 2: Proof Presentation + Consent (< 3 seconds)", () => {
  it("should verify presentation within 3 seconds", async () => {
    const start = Date.now();

    // 1. Verifier creates request
    const req = await request(app).post("/verifier/presentations/request").send({
      verifierDid,
      credentialTypes: ["VerifiableEducationCredential"],
      requiredClaims: { education: ["degree", "institution"] },
      policies: ["require-trusted-issuer"],
    });

    // 2. Wallet creates presentation with consent
    await request(app).post("/wallet/presentations/create").send({
      verificationRequestId: req.body.requestId,
      holderId: "user-1",
      selectedCredentials: [credentialId],
      disclosedClaims: { [credentialId]: ["degree", "institution"] },
      consent: true,
    });

    // 3. Check result
    const result = await request(app).get(`/verifier/presentations/${req.body.requestId}`);

    expect(Date.now() - start).toBeLessThan(3000);
    expect(result.body.result.verified).toBe(true);
  });
});

// test/e2e/03-trust-enforcement.e2e.ts
describe("Scenario 3: Trust Policy Enforcement", () => {
  it("should accept credentials from trusted issuers", async () => {
    // Register issuer as trusted
    await request(app).post("/trust/issuers").send({
      did: trustedIssuerDid,
      name: "MIT University",
      credentialTypes: ["VerifiableEducationCredential"],
    });

    const result = await verifyCredential(credFromTrustedIssuer);
    expect(result.checks.trust.valid).toBe(true);
  });

  it("should reject credentials from untrusted issuers", async () => {
    const result = await verifyCredential(credFromUntrustedIssuer);
    expect(result.checks.trust.valid).toBe(false);
    expect(result.verified).toBe(false);
  });
});

// test/e2e/04-revocation.e2e.ts
describe("Scenario 4: Revocation Checking (< 10 seconds)", () => {
  it("should reflect revocation within 10 seconds", async () => {
    // Verify credential is valid
    let result = await verifyCredential(credential);
    expect(result.checks.status.valid).toBe(true);

    // Revoke it
    const start = Date.now();
    await request(app).post("/status/revoke").send({ credentialId: cred.id });

    // Verify it's now rejected
    result = await verifyCredential(credential);
    expect(Date.now() - start).toBeLessThan(10000);
    expect(result.checks.status.valid).toBe(false);
  });
});

// test/e2e/05-loan-processing.e2e.ts
describe("Scenario 5: Loan Processing E2E (< 2 minutes)", () => {
  it("should complete full loan verification flow", async () => {
    const start = Date.now();

    // 1. Bank issues income credential
    const incomeOffer = await createOffer("VerifiableIncomeCredential", {
      annualIncome: 95000, employer: "TechCorp", currency: "USD",
    });
    const incomeCred = await receiveCredential(incomeOffer, "user-1");

    // 2. University issues education credential
    const eduOffer = await createOffer("VerifiableEducationCredential", {
      degree: "MSc", institution: "MIT", graduationYear: 2023,
    });
    const eduCred = await receiveCredential(eduOffer, "user-1");

    // 3. Loan company creates verification request
    const verReq = await request(app).post("/verifier/presentations/request").send({
      verifierDid: loanCompanyDid,
      credentialTypes: ["VerifiableIncomeCredential", "VerifiableEducationCredential"],
      requiredClaims: {
        income: ["annualIncome"],
        education: ["degree", "institution"],
      },
      policies: ["require-trusted-issuer", "require-active-status"],
    });

    // 4. User presents credentials with consent
    await request(app).post("/wallet/presentations/create").send({
      verificationRequestId: verReq.body.requestId,
      holderId: "user-1",
      selectedCredentials: [incomeCred.id, eduCred.id],
      disclosedClaims: {
        [incomeCred.id]: ["annualIncome"],
        [eduCred.id]: ["degree", "institution"],
      },
      consent: true,
    });

    // 5. Verify result
    const result = await request(app).get(`/verifier/presentations/${verReq.body.requestId}`);

    expect(Date.now() - start).toBeLessThan(120000);
    expect(result.body.result.verified).toBe(true);
    expect(result.body.result.credentials).toHaveLength(2);
  });
});
```

---

## 7. Infrastructure

### 7.1 Docker Compose

```yaml
# infrastructure/docker-compose.yml
version: "3.9"

services:
  api:
    build:
      context: ../
      dockerfile: apps/api/Dockerfile
    ports: ["3000:3000"]
    env_file: ../.env       # DATABASE_URL points to MongoDB Atlas
    environment:
      NODE_ENV: development
      PORT: "3000"
    volumes:
      - ../apps/api/src:/app/apps/api/src  # Hot reload
```

> **Note:** MongoDB runs on Atlas (cloud). No local MongoDB container needed.
> Set `DATABASE_URL` in `.env` to your Atlas connection string.

### 7.2 Dockerfile

```dockerfile
# apps/api/Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source & build
COPY . .
RUN npx turbo build --filter=api

# Production
FROM node:20-alpine
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/apps/api/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

### 7.3 Environment Variables

```bash
# .env.example

# Database (MongoDB Atlas — get your connection string from Atlas dashboard)
DATABASE_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/trustilock?retryWrites=true&w=majority

# Server
NODE_ENV=development
PORT=3000

# DID Configuration
DEFAULT_DID_METHOD=key

# Credential Defaults
DEFAULT_CREDENTIAL_FORMAT=sd-jwt-vc
DEFAULT_CREDENTIAL_EXPIRY_DAYS=365
STATUS_LIST_SIZE=131072

# Issuer Identity (generated on first run)
ISSUER_DID=
ISSUER_BASE_URL=http://localhost:3000/issuer
```

---

## 8. Milestone Execution Breakdown

Milestones are sequential but **not time-bound**. Complete them as fast as you can — 1 day or 5.

```
M1 ──► M2 ──► M3 ──► M4 ──► M5 ──► M6
```

### M1: Foundation

| # | Task | Details |
|---|---|---|
| 1 | Monorepo scaffold | Turborepo, NestJS app, tsconfig, eslint, prettier |
| 2 | Mongoose + MongoDB Atlas | Mongoose schemas in `src/database/schemas/`, connection setup |
| 3 | DID module | did:key provider (create, resolve), ES256 key pair generation |
| 4 | Crypto module | SD-JWT creation (sign, disclosures, hash), verification |
| 5 | Dev server | `pnpm dev` with hot reload (MongoDB is Atlas cloud) |
| 6 | Unit tests | DID + crypto modules passing |

> **TODO (Manual):**
> - [ ] Ensure Node.js 20, pnpm, Docker, Git are installed (see Section 0, #1-3)
> - [ ] Create GitHub repo and clone locally (see Section 0, #4)
> - [ ] Create MongoDB Atlas free cluster and get connection string (see Section 0, #5)
> - [ ] Create `.env` from `.env.example` and set `DATABASE_URL` to Atlas connection string (see Section 0, #6)

**Done when:** `pnpm dev` works, can create did:key, can sign/verify SD-JWT.

**Commit & Push:**
```bash
git add -A && git commit -m "feat(m1): foundation — monorepo, mongoose, did, crypto modules" && git push origin main
```

---

### M2: Issuer (OID4VCI)

| # | Task | Details |
|---|---|---|
| 1 | Credential schemas | Education + Income type definitions in MongoDB |
| 2 | Issuer metadata | `GET /.well-known/openid-credential-issuer` |
| 3 | Credential offer | Generate offer with pre-authorized code + QR |
| 4 | Token endpoint | Exchange pre-authorized code → access_token + c_nonce |
| 5 | Credential endpoint | Verify holder proof → sign SD-JWT-VC → return |
| 6 | Integration test | Full issuance flow < 5 seconds |

> **TODO (Manual):**
> - [ ] Verify issuer metadata at `GET /issuer/.well-known/openid-credential-issuer` returns valid JSON

**Done when:** POST offer → POST token → POST credential returns valid SD-JWT-VC.

**Commit & Push:**
```bash
git add -A && git commit -m "feat(m2): issuer service — OID4VCI endpoints, SD-JWT-VC issuance" && git push origin main
```

---

### M3: Wallet + Status

| # | Task | Details |
|---|---|---|
| 1 | OID4VCI client | Resolve offer → exchange token → receive credential |
| 2 | Credential storage | Store SD-JWT-VCs in MongoDB, list/view/delete |
| 3 | Holder key management | Generate holder did:key, bind to credentials (cnf) |
| 4 | Bitstring Status List | Create, encode (GZIP+Base64), publish at GET endpoint |
| 5 | Revocation API | Revoke → flip bit → update list |
| 6 | Consent tracking | Record what was shared with whom |
| 7 | Tests | Wallet receive + revocation < 10 seconds |

> **TODO (Manual):**
> - [ ] Manually test: call POST `/wallet/credentials/receive` with a real offer URI from M2 and verify credential stored
> - [ ] Manually test: call POST `/status/revoke` and then GET `/status/lists/:id` — verify the bit flipped

**Done when:** Wallet receives creds from issuer, revocation flips status list bit.

**Commit & Push:**
```bash
git add -A && git commit -m "feat(m3): wallet + status — credential storage, OID4VCI client, bitstring revocation" && git push origin main
```

---

### M4: Verifier + Trust

| # | Task | Details |
|---|---|---|
| 1 | Trust Registry CRUD | Register/query/remove trusted issuers + credential types |
| 2 | OID4VP request | Create authorization request with presentation definition |
| 3 | Validation pipeline | Signature → Expiration → Status → Trust → Policy |
| 4 | SD-JWT verification | Verify selective disclosures + holder KB-JWT |
| 5 | Policy engine | JSON-based configurable rules |
| 6 | Trust enforcement | Trusted accepted, untrusted rejected |
| 7 | Tests | OID4VP flow, trust enforcement, verification < 3 seconds |

> **TODO (Manual):**
> - [ ] Manually test: register a trusted issuer via POST `/trust/issuers`, then verify a credential from that issuer passes
> - [ ] Manually test: verify a credential from an unregistered issuer (QuickDegree Online) is rejected

**Done when:** Verifier validates VP, rejects untrusted/revoked credentials.

**Commit & Push:**
```bash
git add -A && git commit -m "feat(m4): verifier + trust — OID4VP, validation pipeline, trust registry, policy engine" && git push origin main
```

---

### M5: E2E Integration

| # | Task | Details |
|---|---|---|
| 1 | Wire all modules | Issuer → Wallet → Verifier full flow |
| 2 | Loan processing E2E | Bank + University issue → User stores → Loan company verifies |
| 3 | Seed data script | Pre-configured issuers, schemas, trust entries, policies |
| 4 | All 5 test scenarios | Automated tests passing |

> **TODO (Manual):**
> - [ ] Run all 5 test scenarios and confirm they pass: `pnpm test:e2e`

**Done when:** All 5 mandatory scenarios pass, loan E2E < 2 minutes.

**Commit & Push:**
```bash
git add -A && git commit -m "feat(m5): e2e integration — all 5 test scenarios passing, loan processing flow" && git push origin main
```

---

### M6: Demo Ready

| # | Task | Details |
|---|---|---|
| 1 | Swagger docs | Auto-generated, all endpoints visible |
| 2 | Postman collection | Complete API collection for live demo |
| 3 | Docker Compose final | `docker compose up` starts everything + seeds data |
| 4 | README | Setup, architecture, demo walkthrough |

> **TODO (Manual):**
> - [ ] Run `docker compose up --build` and verify everything starts clean (see Section 0, #12)
> - [ ] Open `http://localhost:3000/api/docs` — verify all endpoints visible in Swagger
> - [ ] Import Postman collection and run full demo flow manually (see Section 0, #13-14)
> - [ ] Prepare a 5-minute demo narrative for presentation (see Section 0, #15)
> - [ ] Take screenshots of key API responses for slides/docs (see Section 0, #16)
> - [ ] If deploying publicly: choose hosting platform (see Section 0, #17-19)

**Done when:** `docker compose up` → Swagger at localhost:3000/api/docs → Postman can demo E2E.

**Commit & Push:**
```bash
git add -A && git commit -m "feat(m6): demo ready — swagger, postman, docker compose, seed data, README" && git push origin main
```

---

## 9. Seed Data

```typescript
// infrastructure/seed/seed-data.ts

// Trusted Issuers
const trustedIssuers = [
  {
    name: "TrustBank India",
    credentialTypes: ["VerifiableIncomeCredential"],
  },
  {
    name: "National Technical University",
    credentialTypes: ["VerifiableEducationCredential"],
  },
  {
    name: "Digital Identity Authority",
    credentialTypes: ["VerifiableIdentityCredential"],
  },
];

// Untrusted Issuer (for rejection demo — NOT added to trust registry)
const untrustedIssuers = [
  {
    name: "QuickDegree Online",
    credentialTypes: ["VerifiableEducationCredential"],
  },
];

// Verifier
const verifiers = [
  {
    name: "HomeFirst Finance",
    purpose: "Loan eligibility assessment",
    credentialTypes: ["VerifiableIncomeCredential", "VerifiableEducationCredential", "VerifiableIdentityCredential"],
  },
];

// Credential Schemas
const schemas = [
  {
    typeUri: "VerifiableEducationCredential",
    name: "Education Credential",
    sdClaims: ["name", "degree", "institution", "graduationYear", "gpa"],
    schema: {
      name: { type: "string" },
      degree: { type: "string" },
      institution: { type: "string" },
      graduationYear: { type: "number" },
      gpa: { type: "number" },
    },
  },
  {
    typeUri: "VerifiableIncomeCredential",
    name: "Income Credential",
    sdClaims: ["name", "annualIncome", "employer", "employmentType", "employmentSince"],
    schema: {
      name: { type: "string" },
      annualIncome: { type: "number" },
      employer: { type: "string" },
      currency: { type: "string" },        // always disclosed
      employmentType: { type: "string" },
      employmentSince: { type: "string" },
    },
  },
  {
    typeUri: "VerifiableIdentityCredential",
    name: "Identity Credential",
    sdClaims: ["name", "dateOfBirth", "gender", "address", "nationalId"],
    schema: {
      name: { type: "string" },
      dateOfBirth: { type: "string" },
      gender: { type: "string" },
      country: { type: "string" },          // always disclosed
      address: { type: "string" },
      nationalId: { type: "string" },
    },
  },
];

// Verification Policies
const policies = [
  {
    name: "require-trusted-issuer",
    rules: { trustRegistry: { required: true } },
  },
  {
    name: "require-active-status",
    rules: { statusCheck: { required: true, rejectRevoked: true, rejectSuspended: true } },
  },
  {
    name: "require-non-expired",
    rules: { expirationCheck: { required: true } },
  },
];
```

---

## 10. Definition of Done (Prototype)

The prototype is **done** when:

- [ ] All 5 mandatory test scenarios passing
- [ ] `pnpm dev` or `docker compose up` starts API connected to Atlas
- [ ] Swagger UI accessible at `http://localhost:3000/api/docs`
- [ ] Postman collection can demo full E2E flow
- [ ] Credential issuance < 5 seconds
- [ ] Credential verification < 3 seconds
- [ ] Revocation propagation < 10 seconds
- [ ] Loan processing E2E < 2 minutes
- [ ] Trusted issuer accepted, untrusted rejected
- [ ] SD-JWT selective disclosure working (disclose only requested claims)
- [ ] Total cost: **$0**

---

*Document Version: 3.0 | Updated: 2026-03-30 | Scope: Milestone-Based Prototype | Stack: NestJS + Mongoose + MongoDB*
