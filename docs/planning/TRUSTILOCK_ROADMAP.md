# TrustiLock — Prototype Roadmap

## Verifiable Credential Ecosystem | 5-Day Prototype | Zero Budget

---

## 1. Executive Summary

TrustiLock is a standards-compliant Verifiable Credential (VC) ecosystem that enables any organization to **issue**, any individual to **hold**, and any relying party to **verify** digitally signed credentials — replacing paper-based verification with cryptographic trust.

This is a **5-day prototype** built on **W3C Verifiable Credentials Data Model 2.0**, **OpenID for Verifiable Credentials (OID4VC)** protocols, and **Decentralized Identifiers (DIDs)** — with **zero financial investment** using entirely free and open-source tools.

### Prototype vs Production

| Aspect | This Prototype | Future Production |
|---|---|---|
| Architecture | Modular monolith | Microservices |
| Database | MongoDB Atlas (free tier) | MongoDB Atlas dedicated cluster |
| Key Management | Software keys (in-memory) | HSM / Cloud KMS |
| Deployment | Docker Compose (localhost) | Kubernetes |
| Security | Basic (signature verification, input validation) | Full HAIP (DPoP, wallet attestation, mTLS) |
| Monitoring | Console logging | OpenTelemetry + Grafana |
| Cost | **$0** | Cloud infrastructure costs |

---

## 2. Industry Context & Standards Landscape (2025–2026)

### 2.1 Regulatory Drivers

| Regulation | Status | Impact |
|---|---|---|
| **EU eIDAS 2.0** | Mandatory digital identity wallets by end of 2026 | All EU member states must support EUDIW |
| **India DPI** | Active expansion toward verifiable credentials | Aadhaar + DigiLocker evolving to VC standards |
| **US Executive Order 14028** | Zero Trust mandates | Credential-based identity verification |
| **ISO/IEC 18013-5 (mDL)** | Published | Mobile driving license interop standard |

### 2.2 Core Standards

| Standard | Version | Status | Role in TrustiLock |
|---|---|---|---|
| **W3C VC Data Model** | 2.0 | W3C Recommendation (2025) | Credential structure & semantics |
| **W3C DID Core** | 1.0 | W3C Recommendation | Decentralized identifier framework |
| **OID4VCI** | Draft 14+ | OpenID Foundation | Credential issuance protocol |
| **OID4VP** | Draft 23+ | OpenID Foundation | Credential presentation/verification |
| **SD-JWT** | RFC 9680 | IETF Standard | Selective disclosure for JWT credentials |
| **SD-JWT VC** | Draft 05+ | IETF | VC-specific SD-JWT profile |
| **Bitstring Status List** | 1.0 | W3C Recommendation | Credential revocation mechanism |
| **DIF Presentation Exchange** | 2.0 | DIF | Credential query language for verifiers |
| **HAIP** | 1.0 | OpenID Foundation | High Assurance Interoperability Profile |

### 2.3 Credential Format Strategy

| Format | Use Case | Selective Disclosure | Ecosystem Support |
|---|---|---|---|
| **SD-JWT-VC** (Primary) | Production credentials | Native (claim-level) | HAIP, eIDAS 2.0, broad tooling |
| **JWT-VC** (Secondary) | Simple credentials, legacy | None | Universal support |
| **JSON-LD + Data Integrity** (Future) | Semantic interop | Via BBS+ signatures | W3C native, complex tooling |

**Decision: SD-JWT-VC as primary format** — mandated by the EU HAIP profile, provides selective disclosure without JSON-LD/BBS+ complexity, strongest library support.

### 2.4 High Assurance Interoperability Profile (HAIP)

The OpenID Foundation's HAIP constrains OID4VC to a specific interoperable subset. **For prototype we implement the core subset; full HAIP is a production upgrade.**

| Requirement | HAIP Mandate | Prototype Scope |
|---|---|---|
| **Credential Format** | SD-JWT-VC only | Implemented |
| **Signing Algorithm** | ES256 (ECDSA P-256) | Implemented |
| **Holder Key Binding** | `cnf` claim + KB-JWT | Implemented |
| **DPoP** | Required at token endpoint | Deferred (production) |
| **Wallet Attestation** | Required | Deferred (production) |
| **Presentation Protocol** | OID4VP `direct_post` | Implemented |
| **Status Mechanism** | Bitstring Status List | Implemented |

### 2.5 DID Method Strategy

| Method | Type | Use in Prototype |
|---|---|---|
| **did:key** (Primary) | Self-resolving, no infrastructure | Issuers, verifiers, holders — zero setup |
| **did:web** (Optional) | DNS-anchored | Demo if time permits |
| **did:jwk** (Holders) | JWK-based, self-resolving | Holder key binding |

**Decision: did:key for everything in prototype** — zero infrastructure needed. Production upgrades to did:web for organizations.

### 2.6 Library Ecosystem

| Library | Role | Why |
|---|---|---|
| **Sphereon OID4VCI/VP** | OID4VC protocol endpoints | Most complete OSS implementation; used in EU LSP pilots |
| **Sphereon PEX** | Presentation Exchange v2 | DIF PE implementation |
| **Veramo 6.x** | DID/VC agent framework | Modular plugin architecture; DID + key + VC management |
| **panva/jose** | JWT/JWS/JWE/JWK operations | 6000+ stars; industry standard JOSE library |
| **sd-jwt-js (OWF)** | SD-JWT implementation | OpenWallet Foundation reference |

All free and open source. **Total library cost: $0.**

---

## 3. Architecture Overview

### 3.1 Prototype Architecture (Modular Monolith)

```
              Single NestJS Application (Port 3000)
    ┌──────────────────────────────────────────────────┐
    │                                                    │
    │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
    │  │   DID    │  │  Crypto  │  │    Common     │   │
    │  │  Module  │  │  Module  │  │ (Types/Utils) │   │
    │  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
    │       │              │               │            │
    │  ┌────┴─────────────┴───────────────┴────────┐   │
    │  │              Core Services                  │   │
    │  │                                             │   │
    │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │   │
    │  │  │  Issuer  │  │  Wallet  │  │ Verifier │ │   │
    │  │  │ (OID4VCI)│  │ (Storage │  │ (OID4VP) │ │   │
    │  │  │          │  │  +Client)│  │          │ │   │
    │  │  └──────────┘  └──────────┘  └──────────┘ │   │
    │  │                                             │   │
    │  │  ┌──────────┐  ┌──────────┐               │   │
    │  │  │  Trust   │  │  Status  │               │   │
    │  │  │ Registry │  │ Service  │               │   │
    │  │  └──────────┘  └──────────┘               │   │
    │  └─────────────────────────────────────────────┘   │
    │                       │                            │
    │              ┌────────┴────────┐                   │
    │              │ Mongoose + MongoDB │                  │
    │              └─────────────────┘                   │
    └──────────────────────────────────────────────────┘

    Infrastructure: Docker Compose
    ┌───────────────┐
    │ MongoDB Atlas │ (cloud, free tier)
    └───────────────┘
```

### 3.2 Module Breakdown

| Module | Responsibility | Endpoints |
|---|---|---|
| **DID Module** | DID creation (did:key), resolution, key generation | Internal only |
| **Crypto Module** | SD-JWT signing/verification, JWT ops, key management | Internal only |
| **Issuer Module** | OID4VCI endpoints, credential creation & signing | `/issuer/*` |
| **Wallet Module** | Credential storage, OID4VCI client, OID4VP client, consent | `/wallet/*` |
| **Verifier Module** | OID4VP endpoints, validation pipeline, policy engine | `/verifier/*` |
| **Trust Registry Module** | Trusted issuer registry, credential type mapping | `/trust/*` |
| **Status Module** | Bitstring Status List, revocation/suspension | `/status/*` |

### 3.3 Technology Stack (Zero Cost)

| Layer | Technology | Cost | Rationale |
|---|---|---|---|
| **Language** | TypeScript (Node.js 20 LTS) | Free | Best VC library ecosystem |
| **Framework** | NestJS 10+ | Free | Modular, DI, auto-generates Swagger |
| **VC Framework** | Veramo 6.x | Free | DID + VC + key management agent |
| **OID4VC** | Sphereon OID4VCI/OID4VP | Free | Battle-tested in EU LSP pilots |
| **SD-JWT** | sd-jwt-js (OWF) + panva/jose | Free | Reference implementations |
| **Database** | **MongoDB Atlas (cloud, free tier via Mongoose)** | Free (512MB) | JSON-native — perfect for VCs, DIDs, presentations |
| **ODM** | **Mongoose** | Free | Schema validation, query building, middleware |
| **Key Management** | Software keys (Veramo built-in) | Free | In-memory / file-based (prototype only) |
| **Containers** | Docker + Docker Compose | Free | Local development & demo |
| **Testing** | Vitest + Supertest | Free | Unit + API integration testing |
| **API Docs** | Swagger (auto from NestJS) | Free | Zero manual documentation |
| **CI/CD** | GitHub Actions (free tier) | Free | 2000 min/month |
| **Monorepo** | Turborepo | Free | Fast builds, shared packages |

**Why MongoDB + Mongoose:**
- VCs, DID documents, presentation definitions, trust policies — **all JSON documents**
- MongoDB stores them natively without schema gymnastics
- Mongoose provides schema validation, middleware, and query building
- MongoDB Atlas free tier (M0) = 512MB = more than enough for prototype
- No local MongoDB setup needed — cloud-hosted, always available
- No migrations or code generation needed — schemas are defined in code

---

## 4. Manual TODOs (Human Action Required)

> These need **your input** — they cannot be automated or decided by code.

### Setup TODOs (Before Starting)

- [ ] **Install prerequisites:** Node.js 20 LTS, pnpm, Docker Desktop, Git
- [ ] **Create GitHub repo:** `trustilock` → clone locally
- [ ] **Create MongoDB Atlas cluster:** mongodb.com/atlas → free tier (M0, 512MB) → get connection string
- [ ] **Create `.env`** from `.env.example` → paste Atlas `DATABASE_URL`

### Decisions (Already Made)

| Decision | Choice |
|---|---|
| Credential types | **Education + Income + Identity** (3 types) |
| Selective disclosure | Institution/currency always shown; name, income, GPA, DOB are holder's choice |
| E2E use case | **Loan Processing** (multi-issuer, multi-credential) |
| Trusted issuers | **TrustBank India**, **National Technical University**, **Digital Identity Authority** (fictional) |
| Untrusted issuer (for rejection demo) | **QuickDegree Online** |
| Verifier | **HomeFirst Finance** (loan company) |
| Policies | `require-trusted-issuer` + `require-active-status` + `require-non-expired` |

### Demo TODOs (After Development)

- [ ] **Test `docker compose up`** — verify API starts and connects to MongoDB Atlas
- [ ] **Open Swagger UI** at `http://localhost:3000/api/docs` — verify all endpoints
- [ ] **Import Postman collection** — run full demo flow manually
- [ ] **Prepare 5-min demo script** — narrative for presentation
- [ ] **Screenshot key responses** — issuance, verification result, revocation
- [ ] **If deploying publicly:** choose free host (Railway / Render / Fly.io)

---

## 5. Milestone-Based Roadmap

Each milestone is a self-contained deliverable. Complete them in order — no time constraints. Can be done in 1 day or 5.

```
M1 ──► M2 ──► M3 ──► M4 ──► M5 ──► M6
Foundation  Issuer  Wallet+Status  Verifier+Trust  E2E Flows  Demo Ready
```

---

### M1: Foundation (Unlock: Everything)

**Objective:** Project scaffold, DID primitives, cryptographic layer.

| # | Deliverable | Details |
|---|---|---|
| 1 | Monorepo scaffold | Turborepo + NestJS app + shared packages |
| 2 | Mongoose + MongoDB Atlas | Mongoose schemas in `src/database/schemas/`, connection setup |
| 3 | DID Module | did:key creation & resolution, ES256 key pair generation |
| 4 | Crypto Module | SD-JWT creation & verification, JWT signing, key serialization |
| 5 | Docker Compose | NestJS app with hot reload (MongoDB is Atlas cloud) |
| 6 | CI skeleton | ESLint + TypeScript strict + Vitest |

**Exit Criteria:**
- [ ] `pnpm dev` starts app with MongoDB Atlas connected
- [ ] Can create did:key and sign/verify an SD-JWT
- [ ] Unit tests pass for DID + crypto modules

**Blocks:** M2, M3, M4, M5, M6

---

### M2: Issuer Service — OID4VCI (Unlock: Credential Issuance)

**Objective:** Issue SD-JWT-VC credentials via OID4VCI protocol.

| # | Deliverable | Details |
|---|---|---|
| 1 | Issuer metadata | `GET /.well-known/openid-credential-issuer` |
| 2 | Credential offer | Generate offer URI + QR code |
| 3 | Token endpoint | Pre-authorized code → access token + c_nonce |
| 4 | Credential endpoint | Access token + holder proof → SD-JWT-VC |
| 5 | Credential schemas | 2 types: Education + Income |
| 6 | SD-JWT-VC signing | Selective disclosure claims + holder key binding (cnf) |

**Endpoints:**
```
GET  /issuer/.well-known/openid-credential-issuer
POST /issuer/offers
POST /issuer/token
POST /issuer/credential
GET  /issuer/schemas
```

**Exit Criteria:**
- [ ] Full OID4VCI pre-authorized code flow works E2E
- [ ] SD-JWT-VC issued with selectively disclosable claims
- [ ] Credential issuance < 5 seconds (Scenario #1)

**Depends on:** M1

---

### M3: Wallet + Status Service (Unlock: Credential Storage & Revocation)

**Objective:** Receive, store, manage credentials. Revoke via Bitstring Status List.

| # | Deliverable | Details |
|---|---|---|
| 1 | OID4VCI Client | Resolve offer → exchange token → receive credential |
| 2 | Credential storage | Store SD-JWT-VCs in MongoDB |
| 3 | Credential management | List, view details, view claims, delete |
| 4 | Holder key management | Generate holder did:key, bind to credentials |
| 5 | Bitstring Status List | Create, update, publish status lists |
| 6 | Revocation API | Revoke/suspend credential → flip bit in list |
| 7 | Consent tracking | Record disclosures per verifier |

**Endpoints:**
```
POST /wallet/credentials/receive
GET  /wallet/credentials
GET  /wallet/credentials/:id
GET  /wallet/credentials/:id/claims
DELETE /wallet/credentials/:id
POST /wallet/presentations/create
GET  /wallet/consent/history

GET  /status/lists/:id
POST /status/revoke
POST /status/suspend
```

**Exit Criteria:**
- [ ] Wallet receives credentials from issuer via OID4VCI
- [ ] Credentials stored, listed, viewable, deletable
- [ ] Revocation reflected in status list < 10 seconds (Scenario #4)

**Depends on:** M1, M2

---

### M4: Verifier + Trust Registry (Unlock: Credential Verification)

**Objective:** Verify presentations with trust enforcement and policy engine.

| # | Deliverable | Details |
|---|---|---|
| 1 | Trust Registry | CRUD for trusted issuers + credential type mapping |
| 2 | OID4VP request | Create authorization request with presentation definition |
| 3 | Validation pipeline | Signature → Expiration → Status → Trust → Policy |
| 4 | SD-JWT verification | Verify selective disclosures + holder KB-JWT |
| 5 | Policy engine | JSON-based configurable verification rules |
| 6 | Trust enforcement | Accept trusted, reject untrusted issuers |

**Verification Pipeline:**
```
1. Parse SD-JWT-VC → issuer JWT + disclosures + KB-JWT
2. Resolve issuer DID → extract public key
3. Verify issuer signature
4. Verify holder Key Binding JWT (aud, nonce, sd_hash)
5. Check credential expiration
6. Fetch & check Bitstring Status List (revocation)
7. Query Trust Registry (issuer trusted for this type?)
8. Evaluate verifier policy rules
9. Return detailed verification report
```

**Endpoints:**
```
POST /verifier/presentations/request
POST /verifier/presentations/response
GET  /verifier/presentations/:id
POST /verifier/policies
GET  /verifier/policies

GET  /trust/issuers
GET  /trust/issuers/:did
POST /trust/issuers
PUT  /trust/issuers/:did
DELETE /trust/issuers/:did
GET  /trust/verify?issuerDid=x&credentialType=y
```

**Exit Criteria:**
- [ ] Full OID4VP flow: request → wallet presents → verifier validates
- [ ] Trusted issuer accepted, untrusted rejected (Scenario #3)
- [ ] Verification < 3 seconds (Scenario #2)
- [ ] Revoked credential rejected by verifier

**Depends on:** M1, M3

---

### M5: E2E Integration (Unlock: Business Use Cases)

**Objective:** Wire all modules together, implement full domain use cases.

| # | Deliverable | Details |
|---|---|---|
| 1 | Issuer → Wallet flow | Full OID4VCI: offer → token → credential → store |
| 2 | Wallet → Verifier flow | Full OID4VP: request → consent → present → validate |
| 3 | Loan Processing E2E | Bank + University issue → User stores → Loan company verifies |
| 4 | All 5 test scenarios | Automated tests for mandatory scenarios |
| 5 | Seed data script | Pre-configured issuers, schemas, trust entries, policies |

**Mandatory Test Scenarios:**

| # | Scenario | SLA | Pass Criteria |
|---|---|---|---|
| 1 | Credential Issuance | < 5 sec | Issuer creates offer → Wallet receives SD-JWT-VC |
| 2 | Proof Presentation + Consent | < 3 sec | Verifier requests → User consents → VP validated |
| 3 | Trust Policy Enforcement | — | Trusted issuer accepted, untrusted rejected |
| 4 | Revocation Checking | < 10 sec | Revoke → Status updated → Verification fails |
| 5 | Loan Processing E2E | < 2 min | Bank + University issue → Loan company verifies both |

**Exit Criteria:**
- [ ] All 5 mandatory scenarios passing
- [ ] Full loan processing flow demonstrated E2E
- [ ] Seed script populates demo data on startup

**Depends on:** M2, M3, M4

---

### M6: Demo Ready (Unlock: Presentation / Submission)

**Objective:** Polish, document, package for demo.

| # | Deliverable | Details |
|---|---|---|
| 1 | Swagger docs | Auto-generated, all endpoints documented |
| 2 | Postman collection | Complete API collection for live demo |
| 3 | Docker Compose final | `docker compose up` starts everything |
| 4 | Seed on startup | Auto-seed trusted issuers, schemas, policies |
| 5 | README | Setup instructions, architecture overview, demo walkthrough |

**Exit Criteria:**
- [ ] `docker compose up` → everything starts, seed data loaded
- [ ] Swagger UI at `http://localhost:3000/api/docs`
- [ ] Postman collection can demo full E2E flow
- [ ] Total cost: **$0**

**Depends on:** M5

---

## 6. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Sphereon libs have breaking changes | Medium | High | Pin exact versions; fallback to manual OID4VC implementation |
| SD-JWT-VC signing complexity | Medium | Medium | Start with JWT-VC, upgrade to SD-JWT once M1 crypto is solid |
| MongoDB + Mongoose edge cases | Low | Medium | Mongoose MongoDB support is mature; use native driver as fallback |
| OID4VCI/VP protocol complexity | Medium | High | Implement simplified flows first, add spec compliance iteratively |
| Integration across modules | Medium | Medium | M1 foundation must be solid; test each module before wiring |

---

## 7. Success Metrics

| Metric | Target |
|---|---|
| All 5 mandatory test scenarios | Passing |
| Credential issuance E2E | < 5 seconds |
| Credential verification E2E | < 3 seconds |
| Revocation propagation | < 10 seconds |
| Full domain use case | < 2 minutes |
| Standards compliance | OID4VCI, OID4VP, W3C VC 2.0, SD-JWT-VC |
| Total cost | **$0** |
| Demo ready | One-command startup |

---

## 8. Dependencies & Assumptions

### Dependencies (All Free)
- Node.js 20 LTS + pnpm installed
- Docker Desktop installed (for API container only)
- MongoDB Atlas free tier (M0 cluster, cloud-hosted)
- GitHub account (for repo + Actions)

### Assumptions
- TypeScript/NestJS is the implementation language
- Modular monolith architecture (single deployable)
- UI/UX handled separately — this is backend/API only
- did:key used for all DIDs (zero infrastructure)
- Software-based key management (no HSM for prototype)
- Localhost deployment (no cloud hosting needed)

---

## 9. Future Production Upgrades (Post-Prototype)

When moving from prototype to production, upgrade these:

| Component | Prototype | Production Upgrade |
|---|---|---|
| Architecture | Modular monolith | Microservices (6 services) |
| Database | MongoDB Atlas free tier (M0) | MongoDB Atlas dedicated cluster (replica set) |
| Key Management | Software keys | HSM / AWS KMS / HashiCorp Vault |
| DID Method | did:key | did:web (organizations) + did:jwk (holders) |
| Security | Basic signature verification | Full HAIP (DPoP, wallet attestation, mTLS) |
| Deployment | Docker Compose | Kubernetes + Helm + Terraform |
| Monitoring | Console logs | OpenTelemetry + Prometheus + Grafana |
| Caching | In-memory | Redis (DID cache, status list cache) |
| Events | Direct function calls | NATS event bus |
| CI/CD | GitHub Actions (basic) | Full pipeline with security scanning |
| Testing | Unit + E2E | + Load testing (k6) + Penetration testing |
| **Onboarding** | Seed script (fictional issuers) | Full onboarding process (see `TRUSTILOCK_ONBOARDING.md`) |
| **Governance** | You decide who's trusted | Trust Framework with legal agreements |
| **Issuer Integration** | Issuers are internal/simulated | Real orgs with did:web, own HSMs, OID4VCI on their infra |
| **Verifier Registration** | Hardcoded policies | Registered verifiers with purpose limitation and data minimization |

> **See:** [`TRUSTILOCK_ONBOARDING.md`](./TRUSTILOCK_ONBOARDING.md) for the complete production onboarding process — issuer verification, legal agreements, DID setup, testing, certification, and go-live.

---

*Document Version: 3.0 | Updated: 2026-03-30 | Scope: Milestone-Based Prototype | Budget: $0*
