# TrustiLock — Verifiable Credential Ecosystem

## Presentation & Concept Guide

---

## 1. THE PROBLEM — Why Does This Project Exist?

### How Credentials Work Today (The Broken System)

When you apply for a loan, a job, or admission to a university, you need to **prove things about yourself** — your degree, your income, your identity. Today, this works like this:

```
You → Give a photocopy of your marksheet → Bank employee manually verifies it
```

**What is wrong with this?**

| Problem | Example |
|---------|---------|
| **Slow** | Verification takes days or weeks (phone calls, emails, manual checks) |
| **Fraud-prone** | Anyone can photoshop a marksheet or salary slip |
| **No privacy** | You hand over your ENTIRE document when the bank only needs your GPA |
| **Centralized** | If the university database is down, verification is impossible |
| **No standards** | Every organization verifies differently — no interoperability |

### The Real-World Pain

Imagine applying for a home loan:

1. You collect your degree certificate, salary slip, and Aadhaar card (physical copies)
2. You submit photocopies to the bank
3. The bank sends emails to your university, employer, and government agency
4. Each organization manually responds (or does not)
5. The bank makes a decision 2-4 weeks later

**This is how the entire world still works.** There is no digital, instant, privacy-preserving way to prove who you are and what you have achieved.

---

## 2. THE SOLUTION — Verifiable Credentials

### What is a Verifiable Credential (VC)?

A Verifiable Credential is a **digitally signed document** — like a physical certificate, but cryptographic instead of paper.

**Physical world analogy:**

```
Physical Certificate          Verifiable Credential
─────────────────────         ──────────────────────
Printed on paper        →     Stored as digital data (JSON)
Stamped with a seal     →     Signed with a cryptographic key
Verified by calling     →     Verified by checking the signature
  the university               (instant, no phone call needed)
Can be photocopied      →     Cannot be forged (math prevents it)
Shows ALL your info     →     Shows ONLY what you choose (selective disclosure)
```

**A VC contains three things:**

```json
{
  "issuer": "did:key:zNationalTechnicalUniversity",    ← WHO issued it
  "subject": "did:key:zSandhyaSharma",                 ← WHO it is about
  "claims": {                                           ← WHAT it says
    "degree": "B.Tech",
    "field": "Computer Science",
    "gpa": 3.8,
    "graduationDate": "2024-06-15"
  },
  "signature": "eyJhbGciOiJFUzI1NiJ9..."               ← PROOF it is real
}
```

### Why VCs Matter

| Benefit | Explanation |
|---------|-------------|
| **Instant verification** | Check the signature — no phone calls, no waiting |
| **Tamper-proof** | If anyone changes even one character, the signature breaks |
| **Privacy-preserving** | Share only your GPA, not your full marksheet |
| **Decentralized** | No central database needed — the credential itself is proof |
| **Interoperable** | Built on W3C standards — works across organizations and countries |

---

## 3. KEY CONCEPTS — The Building Blocks

### 3.1 The Three Roles (The Trust Triangle)

Every VC system has exactly three actors:

```
        ┌──────────────────┐
        │     ISSUER       │
        │  (University,    │
        │   Bank, Govt)    │
        └────────┬─────────┘
                 │
           Issues credential
                 │
                 ▼
        ┌──────────────────┐
        │     HOLDER       │          presents credential
        │  (You — the      │  ──────────────────────────▶  ┌──────────────────┐
        │   individual)    │                                │    VERIFIER      │
        └──────────────────┘                                │  (Loan company,  │
                                                            │   Employer, etc) │
                                                            └──────────────────┘
```

| Role | Who | What They Do | Example |
|------|-----|-------------|---------|
| **Issuer** | Organization with authority | Creates and signs credentials | University issues a degree |
| **Holder** | Individual person | Stores credentials, chooses what to share | Student holds their degree in a wallet |
| **Verifier** | Organization that needs proof | Requests and validates credentials | Bank checks the degree for a loan |

**Key insight:** The issuer and verifier **never need to talk to each other directly**. The holder carries the proof — and the cryptographic signature is enough for the verifier to trust it.

---

### 3.2 DID (Decentralized Identifier) — Digital Identity Without Centralization

**What:** A DID is a unique identifier that you control — no company or government owns it.

**Why it exists:** Today, your identity is controlled by others:
- Google controls your `sandhya@gmail.com`
- Aadhaar is controlled by UIDAI
- Your university ID is controlled by the university

If any of these organizations disappear, your identity is gone.

**How it works:**

```
Traditional Identifier                DID
──────────────────────                ──────────────────────
sandhya@gmail.com                     did:key:z6Mkt8wJ...
   ↑ Google controls this               ↑ YOU control this
   ↑ Google can delete it                ↑ No one can delete it
   ↑ Google verifies it                  ↑ Math verifies it
```

A DID is linked to a **key pair** (public key + private key):
- **Private key** — only you have it (like a password, but unguessable)
- **Public key** — everyone can see it (used to verify your signatures)

**In TrustiLock:** We use `did:key` — the simplest DID method where the public key IS the identifier. No blockchain, no server, no cost.

```
did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
       ↑                ↑
    method          public key encoded as the identifier
```

---

### 3.3 SD-JWT-VC — The Credential Format (Selective Disclosure)

**What:** SD-JWT-VC (Selective Disclosure JSON Web Token — Verifiable Credential) is the format we store and transmit credentials in.

**Why not just a regular JWT?** Regular JWTs show ALL claims to everyone. SD-JWT lets the holder **choose which claims to reveal**.

**Example — Proving you have a degree without revealing your GPA:**

```
Full credential (what the issuer signed):
┌─────────────────────────────────────────┐
│  candidateName: "Sandhya Sharma"        │  ← always visible (fixed claim)
│  institutionName: "NTU"                 │  ← always visible (fixed claim)
│  degree: "B.Tech"                       │  ← always visible (fixed claim)
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│  fieldOfStudy: "Computer Science"       │  ← selectively disclosable
│  gpa: 3.8                              │  ← selectively disclosable
│  graduationDate: "2024-06-15"           │  ← selectively disclosable
│  studentId: "NTU-2020-CS-1042"          │  ← selectively disclosable
└─────────────────────────────────────────┘

What you share with a loan company:
┌─────────────────────────────────────────┐
│  candidateName: "Sandhya Sharma"        │  ✓ shown
│  institutionName: "NTU"                 │  ✓ shown
│  degree: "B.Tech"                       │  ✓ shown
│  fieldOfStudy: "Computer Science"       │  ✓ you chose to reveal this
│  gpa: ████████                          │  ✗ hidden — bank does not need this
│  graduationDate: ████████               │  ✗ hidden
│  studentId: ████████                    │  ✗ hidden
└─────────────────────────────────────────┘
```

**How SD-JWT works internally:**
1. Each selectively disclosable claim is hashed and put in the JWT payload as a hash
2. The actual values are stored separately as "disclosures"
3. When presenting, the holder includes only the disclosures they want to reveal
4. The verifier can check: "yes, the hash of this disclosed value matches the hash in the signed JWT"

**This means:** The signature remains valid even when some claims are hidden. The verifier trusts the revealed claims because the issuer signed the hashes.

---

### 3.4 OID4VCI — How Credentials Are Issued

**What:** OpenID for Verifiable Credential Issuance — a protocol (set of rules) for how an issuer gives a credential to a holder.

**Why a protocol?** Without a standard, every issuer would invent their own way. With OID4VCI, any wallet can receive credentials from any issuer.

**The flow (Pre-Authorized Code):**

```
ISSUER (Web Portal)                          WALLET (Phone App)
       │                                           │
  1.   │  Create credential offer                  │
       │  → Generate QR code with offer URI        │
       │                                           │
       │           ◄── Phone scans QR ──           │
       │                                           │
  2.   │                                     Parse the offer URI
       │                                     Extract: issuer URL,
       │                                     credential type, auth code
       │                                           │
  3.   │  ◄── POST /issuer/token ──────────────── │
       │      (send pre-authorized code)           │
       │  ──── Return access_token + c_nonce ────▶ │
       │                                           │
  4.   │  ◄── POST /issuer/credential ──────────── │
       │      (send access_token + holder proof)   │
       │  ──── Return signed SD-JWT-VC ──────────▶ │
       │                                           │
  5.   │                                     Store credential
       │                                     in secure wallet
       │                                           │
       ▼                                           ▼
   DONE — Credential issued                  DONE — Credential received
```

**Key security features:**
- **Pre-authorized code** — one-time use, expires in 10 minutes
- **c_nonce** (challenge nonce) — prevents replay attacks
- **Holder proof** — proves the wallet actually holds the private key

---

### 3.5 OID4VP — How Credentials Are Verified

**What:** OpenID for Verifiable Presentations — a protocol for how a verifier requests and receives proof from a holder.

**Why different from issuance?** Issuance is "here, take this credential." Verification is "prove something to me" — it requires consent, selective disclosure, and trust checking.

**The flow:**

```
VERIFIER (Web Portal)                         WALLET (Phone App)
       │                                           │
  1.   │  Create verification request              │
       │  → "I need: education + income creds"     │
       │  → Generate QR code                       │
       │                                           │
       │           ◄── Phone scans QR ──           │
       │                                           │
  2.   │                                     Show user:
       │                                     "HomeFirst Finance wants:"
       │                                     □ Education Credential
       │                                     □ Income Credential
       │                                           │
  3.   │                                     User selects which claims
       │                                     to disclose:
       │                                     ☑ Name, Degree, Employer
       │                                     ☐ GPA (hidden)
       │                                     ☐ Student ID (hidden)
       │                                           │
  4.   │                                     User gives CONSENT
       │                                     → "I allow this sharing"
       │                                           │
  5.   │  ◄── POST presentation (VP token) ─────── │
       │                                           │
  6.   │  Run validation pipeline:                 │
       │  ✓ Signature valid?                       │
       │  ✓ Issuer trusted?                        │
       │  ✓ Credential not revoked?                │
       │  ✓ Credential not expired?                │
       │  → Result: VERIFIED ✓                     │
       ▼                                           ▼
   DONE — Proof verified                     DONE — Shared with consent
```

---

### 3.6 Trust Registry — Who Do We Trust?

**What:** A registry of issuers that the verifier trusts to issue specific credential types.

**Why it exists:** Anyone can create a DID and sign a credential. The question is: **should I trust this issuer?**

**Example:**

```
Trust Registry:
┌──────────────────────────────────────────────────────────────┐
│ did:key:zNTU            │ National Technical University      │
│                         │ Authorized: Education Credentials  │
│                         │ Status: ACTIVE ✓                   │
├─────────────────────────┼────────────────────────────────────┤
│ did:key:zApexFinancial  │ Apex Financial Services            │
│                         │ Authorized: Income Credentials     │
│                         │ Status: ACTIVE ✓                   │
├─────────────────────────┼────────────────────────────────────┤
│ did:key:zFakeUniversity │ QuickDegree Online                 │
│                         │ Status: SUSPENDED ✗                │
└─────────────────────────┴────────────────────────────────────┘
```

**When a credential from NTU is presented:** Trust check passes — NTU is in the registry and authorized for education credentials.

**When a credential from QuickDegree Online is presented:** Trust check fails — suspended. The credential itself may be cryptographically valid, but the issuer is not trusted.

---

### 3.7 Bitstring Status List — Credential Revocation

**What:** A mechanism for issuers to revoke or suspend credentials after they have been issued.

**Why it exists:** Credentials are long-lived (often valid for years). But circumstances change:
- An employee is fired → income credential should be revoked
- A student is expelled → education credential should be revoked
- A fraud is discovered → identity credential should be revoked

**How it works:**

```
Status List (one per issuer):
┌─────────────────────────────────────────────────┐
│ Bit 0: 0 (active)    → Sandhya's degree         │
│ Bit 1: 0 (active)    → Raj's degree             │
│ Bit 2: 1 (REVOKED)   → Old student's degree     │
│ Bit 3: 0 (active)    → Another credential       │
│ ...                                              │
│ Bit 131071: 0                                    │
└─────────────────────────────────────────────────┘
   ↑
   131,072 bits = 16 KB compressed
   Each credential gets one bit
   0 = active, 1 = revoked
```

**When verifying:** The verifier checks the credential's assigned bit in the issuer's status list. If the bit is `1`, the credential is revoked — verification fails.

**Why a bitstring?** Privacy. The verifier downloads the entire list and checks locally — it never tells the issuer WHICH credential it is checking. This prevents the issuer from tracking who is verifying whom.

---

### 3.8 ES256 (P-256) — The Cryptographic Algorithm

**What:** The specific signing algorithm used for all credentials.

**Why ES256?**
- Required by HAIP (High Assurance Interoperability Profile) — the EU standard for digital identity
- Supported by all modern platforms (iOS, Android, browsers, hardware security modules)
- Compact signatures (64 bytes vs 256 for RSA)
- Strong security (128-bit equivalent)

**How signing works:**

```
Issuer has:
  Private Key (secret) ──▶ Signs the credential
  Public Key (shared)  ──▶ Anyone can verify the signature

Signing:  credential + private_key → signature
Verifying: credential + signature + public_key → true/false

If even ONE bit of the credential changes, verification returns FALSE.
```

---

## 4. TRUSTILOCK ARCHITECTURE

### System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        TRUSTILOCK ECOSYSTEM                          │
│                                                                      │
│  ┌─────────────┐   ┌─────────────┐   ┌──────────────────────────┐  │
│  │ Issuer      │   │ Verifier    │   │ Trust Admin              │  │
│  │ Portal      │   │ Portal      │   │ Dashboard                │  │
│  │ (Next.js)   │   │ (Next.js)   │   │ (Next.js)                │  │
│  └──────┬──────┘   └──────┬──────┘   └────────────┬─────────────┘  │
│         │                  │                        │                │
│         │    ┌─────────────┴────────────────────────┘                │
│         │    │                                                       │
│         ▼    ▼                                                       │
│  ┌──────────────────────────────────────────────┐                   │
│  │           NestJS API (Port 8000)             │                   │
│  │                                              │                   │
│  │  ┌──────┐ ┌────────┐ ┌────────┐ ┌────────┐  │                   │
│  │  │ Auth │ │  DID   │ │ Crypto │ │ Issuer │  │                   │
│  │  └──────┘ └────────┘ └────────┘ └────────┘  │                   │
│  │  ┌────────┐ ┌──────────┐ ┌──────┐ ┌──────┐  │                   │
│  │  │ Wallet │ │ Verifier │ │Trust │ │Status│  │                   │
│  │  └────────┘ └──────────┘ └──────┘ └──────┘  │                   │
│  └──────────────────┬───────────────────────────┘                   │
│                     │                                                │
│                     ▼                                                │
│  ┌──────────────────────────────┐                                   │
│  │   MongoDB (Mongoose ODM)    │                                    │
│  │   Local or Atlas (cloud)    │                                    │
│  └──────────────────────────────┘                                   │
│                                                                      │
│         ┌──────────────────┐                                        │
│         │  Mobile Wallet   │                                        │
│         │  (React Native   │                                        │
│         │   + Expo)        │                                        │
│         │  QR scan, store, │                                        │
│         │  present, consent│                                        │
│         └──────────────────┘                                        │
└──────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Why This Choice |
|-------|-----------|-----------------|
| **Backend** | NestJS (TypeScript) | Modular, dependency injection, auto-generates Swagger docs |
| **Database** | MongoDB via Mongoose | JSON-native (VCs and DIDs are JSON), flexible schema |
| **Mobile** | React Native + Expo | Cross-platform (iOS + Android), QR scanning, secure storage |
| **Web** | Next.js + shadcn/ui | Server-side rendering, fast dashboards, modern UI |
| **Crypto** | jose + @sd-jwt/sd-jwt-vc | Industry-standard JWT/SD-JWT libraries |
| **Auth** | JWT (access + refresh tokens) | Stateless, rotation + reuse detection |
| **Monorepo** | Turborepo + pnpm | Shared types, parallel builds, single install |

**Total infrastructure cost: $0** — all free tier services.

---

## 5. MODULE BREAKDOWN — What Each Module Does

### Auth Module
- **What:** User registration, login, JWT tokens, role-based access
- **Why:** Every API call needs to know WHO is calling and WHAT role they have
- **Roles:** admin, issuer, verifier, holder

### DID Module
- **What:** Creates and resolves Decentralized Identifiers
- **Why:** Every entity (issuer, holder) needs a unique, cryptographic identity
- **Method:** did:key (self-resolving, no infrastructure needed)

### Crypto Module
- **What:** SD-JWT signing, verification, key management
- **Why:** All credentials must be cryptographically signed and verifiable
- **Algorithm:** ES256 (P-256 curve, HAIP-compliant)

### Issuer Module
- **What:** OID4VCI endpoints — create offers, exchange tokens, issue credentials
- **Why:** Implements the standard protocol for credential issuance
- **Endpoints:** `/issuer/offers`, `/issuer/token`, `/issuer/credential`

### Wallet Module
- **What:** Credential storage, OID4VCI client, OID4VP client, consent tracking
- **Why:** The holder needs to receive, store, and present credentials
- **Key feature:** Selective disclosure — holder chooses which claims to reveal

### Verifier Module
- **What:** OID4VP endpoints, validation pipeline, policy engine
- **Why:** Verifiers need to request and validate credential presentations
- **Pipeline:** signature → trust registry → revocation → expiration → result

### Trust Module
- **What:** Registry of trusted issuers and their authorized credential types
- **Why:** Not every issuer should be trusted — this module enforces trust boundaries

### Status Module
- **What:** Bitstring Status List — revocation and suspension of credentials
- **Why:** Issuers must be able to revoke credentials after they are issued

---

## 6. DEMO FLOW — Loan Processing Scenario

### Actors

| Actor | Name | Role | Portal |
|-------|------|------|--------|
| University | National Technical University | Issuer | Web — Issuer Portal |
| Bank | Apex Financial Services | Issuer | Web — Issuer Portal |
| Loan Company | HomeFirst Finance | Verifier | Web — Verifier Portal |
| Applicant | Sandhya Sharma | Holder | Mobile Wallet |
| Administrator | TrustiLock Admin | Admin | Web — Admin Portal |

### Step-by-Step Demo Script

**Step 1 — Admin sets up the trust registry**
- Login as `admin@trustilock.dev`
- Register NTU and Apex as trusted issuers
- Configure their authorized credential types

**Step 2 — University issues education credential**
- Login as `issuer@trustilock.dev` (Issuer Portal)
- Create new credential offer: B.Tech degree for Sandhya
- Fill in claims: degree, field, GPA, graduation date
- QR code appears on screen

**Step 3 — Student receives the credential**
- Open mobile wallet as `holder@trustilock.dev`
- Scan the QR code
- Preview the credential details
- Tap "Accept" → credential stored securely

**Step 4 — Bank issues income credential**
- Login as second issuer (Apex Financial Services)
- Create income credential: employment details, salary
- Student scans QR → credential stored in wallet

**Step 5 — Loan company requests verification**
- Login as `verifier@trustilock.dev` (Verifier Portal)
- Create verification request: "I need education + income credentials"
- QR code appears on screen

**Step 6 — Student presents credentials with selective disclosure**
- Scan the QR code from the wallet
- See: "HomeFirst Finance requests your Education and Income credentials"
- Select which claims to share:
  - ✅ Name, Degree, Employer, Salary
  - ❌ GPA, Student ID (hidden — loan company does not need these)
- Tap "Allow" → consent recorded, presentation submitted

**Step 7 — Loan company sees verification result**
- Verification pipeline runs automatically:
  - ✅ Signature: valid
  - ✅ Issuer: trusted (NTU and Apex are in the registry)
  - ✅ Status: active (not revoked)
  - ✅ Expiration: valid (not expired)
- **Result: VERIFIED** — loan can proceed

**Step 8 (Bonus) — Revocation demo**
- University revokes Sandhya's education credential (fraud discovered)
- Loan company re-verifies → **REJECTED** (credential is now revoked)
- Demonstrates real-time revocation checking

---

## 7. WHAT MAKES TRUSTILOCK DIFFERENT

| Aspect | TrustiLock | Traditional Systems |
|--------|-----------|-------------------|
| **Verification speed** | < 3 seconds | Days to weeks |
| **Fraud prevention** | Cryptographic — impossible to forge | Paper-based — easy to forge |
| **Privacy** | Share only what is needed | Share entire documents |
| **User control** | Holder decides what to share | Organization decides |
| **Interoperability** | W3C + OpenID standards | Proprietary, siloed |
| **Cost** | $0 infrastructure | Expensive verification services |
| **Consent** | Recorded and auditable | Implicit, no trail |
| **Revocation** | Real-time (< 10 seconds) | Manual, slow notification |

---

## 8. STANDARDS COMPLIANCE

| Standard | Body | What It Covers | TrustiLock Support |
|----------|------|---------------|-------------------|
| W3C VC Data Model 2.0 | W3C | Credential structure | ✅ Full |
| W3C DID Core 1.0 | W3C | Decentralized identifiers | ✅ did:key |
| OID4VCI | OpenID Foundation | Credential issuance protocol | ✅ Pre-auth code flow |
| OID4VP | OpenID Foundation | Presentation/verification protocol | ✅ Direct post |
| SD-JWT-VC | IETF | Selective disclosure format | ✅ Primary format |
| Bitstring Status List | W3C | Credential revocation | ✅ Full |
| HAIP | OpenID Foundation | High assurance interoperability | ✅ ES256, P-256 |

---

## 9. DEFAULT DEMO CREDENTIALS

| Email | Password | Role |
|-------|----------|------|
| `admin@trustilock.dev` | `Admin@123456` | Admin — full system access |
| `issuer@trustilock.dev` | `Issuer@123456` | Issuer — create and manage credentials |
| `issuer2@trustilock.dev` | `Issuer@123456` | Issuer — second issuer account |
| `verifier@trustilock.dev` | `Verifier@123456` | Verifier — create verification requests |
| `verifier2@trustilock.dev` | `Verifier@123456` | Verifier — second verifier account |
| `holder@trustilock.dev` | `Holder@123456` | Holder — mobile wallet (has 3 pre-seeded credentials) |
| `holder2@trustilock.dev` | `Holder@123456` | Holder — second wallet account |

---

## 10. PROJECT MILESTONES

| # | Milestone | What Was Built |
|---|-----------|---------------|
| M1 | Foundation | Monorepo, Mongoose + MongoDB, DID module, Crypto module |
| M2 | Issuer | OID4VCI endpoints, credential offers, SD-JWT-VC signing |
| M3 | Wallet + Status | Credential storage, OID4VCI client, Bitstring Status List |
| M4 | Verifier + Trust | OID4VP endpoints, validation pipeline, trust registry |
| M5 | E2E Integration | Full flows, 5 test scenarios, seed data, consent tracking |
| M6 | Demo Ready | Swagger docs, Docker, setup scripts, presentation guide |

---

## 11. FUTURE PRODUCTION UPGRADES

| Aspect | Current (Prototype) | Production |
|--------|-------------------|------------|
| Architecture | Monolith | Microservices |
| Key storage | Software keys | Hardware Security Module (HSM) |
| DID method | did:key | did:web (DNS-anchored) |
| Database | Local MongoDB / Atlas free | Atlas dedicated cluster |
| Deployment | Docker Compose | Kubernetes |
| Monitoring | Console logs | OpenTelemetry + Grafana |
| Mobile wallet | Expo Go | Native builds (App Store / Play Store) |
