# TrustiLock User Guide

## What is TrustiLock?

TrustiLock is a digital credential platform that lets organizations issue tamper-proof digital documents (like diplomas, income letters, and ID cards) and lets individuals store, manage, and share those documents from their phone. Think of it as a **digital wallet for official documents** — just like your physical wallet holds your driver's license and bank cards, TrustiLock holds verified digital versions of your important documents that anyone can instantly verify as authentic.

---

## How It Works (The Big Picture)

TrustiLock has four actors that work together:

| Actor | Who They Are | Real-World Analogy |
|---|---|---|
| **Issuer** | An organization that creates credentials (a university, bank, or government agency) | The office that prints your diploma or pay stub |
| **Holder** | You — the person who receives and stores credentials | You, carrying documents in your wallet |
| **Verifier** | An organization that needs to check your credentials (a loan company, employer, or landlord) | The person at the counter who asks to see your ID |
| **Trust Registry** | A list of approved issuers that verifiers can trust | The government list of accredited universities |

### The Flow

```
  ISSUER                    HOLDER (You)                 VERIFIER
  (University)              (Phone Wallet)               (Loan Company)
      |                          |                            |
  1.  |--- Creates credential -->|                            |
      |    (scans QR code)       |                            |
  2.  |                          |-- Stores in wallet         |
      |                          |                            |
  3.  |                          |<-- Requests proof ---------|
      |                          |                            |
  4.  |                          |-- Chooses what to share -->|
      |                          |   (selective disclosure)   |
  5.  |                          |                            |-- Checks:
      |                          |                            |   - Trusted issuer?
      |                          |                            |   - Valid signature?
      |                          |                            |   - Not expired?
      |                          |                            |   - Not revoked?
  6.  |                          |                            |-- VERIFIED
```

---

## Authentication

TrustiLock uses JWT (JSON Web Token) authentication. Every user must log in to access protected features.

### Default Accounts

These accounts are created automatically when you seed the database:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@trustilock.dev` | `Admin@123456` | Admin | Full access — trust registry, policies, all endpoints |
| `issuer@trustilock.dev` | `Issuer@123456` | Issuer | Create offers, issue credentials, revoke/suspend |
| `verifier@trustilock.dev` | `Verifier@123456` | Verifier | Create verification requests, view results |
| `holder@trustilock.dev` | `Holder@123456` | Holder | Wallet — receive, store, present credentials |

### How Login Works

1. Send your email and password to `/auth/login`
2. You receive two tokens:
   - **Access token** (15 minutes) — used in every API request
   - **Refresh token** (7 days) — used to get a new access token when it expires
3. Include the access token in every request: `Authorization: Bearer <token>`
4. When the access token expires, send the refresh token to `/auth/refresh` to get a new pair

### Role Permissions

| Role | Can Do | Cannot Do |
|------|--------|-----------|
| **Admin** | Everything — manage trust registry, create policies, view all data | Nothing restricted |
| **Issuer** | Create credential offers, view issued credentials, revoke/suspend | Modify trust registry, create policies |
| **Verifier** | Create verification requests, view results | Issue credentials, modify trust registry |
| **Holder** | Receive credentials, view wallet, create presentations, consent history | Issue credentials, verify, admin tasks |

### Public Endpoints (No Login Required)

These endpoints work without any authentication:
- Credential schemas (`GET /issuer/schemas`)
- Issuer metadata (`GET /issuer/.well-known/openid-credential-issuer`)
- OID4VCI protocol endpoints (`POST /issuer/token`, `POST /issuer/credential`)
- Trust registry (read) (`GET /trust/issuers`, `GET /trust/verify`)
- Status lists (`GET /status/lists/:id`)
- Verifier policies (`GET /verifier/policies`)
- Auth endpoints (`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`)
- Swagger docs (`GET /api/docs`)

---

## Features

### 1. Digital Wallet (Mobile App)

The mobile wallet is a phone app where you receive, store, and share your digital credentials.

**What it does:**

- Stores your credentials securely on your phone (encrypted storage)
- Lets you scan QR codes to receive new credentials
- Shows all your credentials in one place with a clean, card-like view
- Lets you choose exactly which details to share when someone asks for verification
- Keeps a record of every time you shared a credential (consent log)

**How to receive a credential:**

1. An issuer (like your university) creates a credential offer for you
2. The issuer shows you a QR code (on their screen or sends it to you)
3. Open the TrustiLock app on your phone
4. Tap "Receive Credential" and point your camera at the QR code
5. Review the credential details on screen
6. Tap "Accept" to store it in your wallet

**How to share credentials (selective disclosure):**

When a verifier asks for proof, you do not have to share everything. For example, a loan company might need to know your income amount but does not need your employee ID. This is called **selective disclosure** — you pick exactly which pieces of information to reveal.

1. A verifier sends a verification request (you scan their QR code or receive a link)
2. The app shows you what they are asking for
3. You see checkboxes next to each piece of information
4. Required items are pre-checked (you cannot uncheck these)
5. Optional items are yours to include or exclude
6. Tap "Share" to send only what you approved

**Consent tracking:**

Every time you share a credential, the app records what you shared, who you shared it with, when, and which specific details you disclosed. You can view this history anytime.

---

### 2. Issuer Dashboard (Web Portal)

**Login:** `issuer@trustilock.dev` / `Issuer@123456`

The Issuer Dashboard is a web-based control panel for organizations that issue credentials.

**Who uses it:** Universities, banks, employers, government agencies.

**Creating credential offers:**

1. Log into the Issuer Dashboard
2. Select the credential type (Education, Income, or Identity)
3. Fill in the credential details (for example: degree name, field of study, graduation date)
4. Click "Create Offer" — the system generates a QR code
5. The holder scans this QR code with their phone to receive the credential

**Credential types available:**

| Type | Example Fields | Typical Issuer |
|---|---|---|
| **Education** | Institution, degree, field of study, GPA, graduation date | University |
| **Income** | Employer, job title, annual income, currency, start date | Bank or employer |
| **Identity** | Full name, date of birth, nationality, document number | Government agency |

**Revoking credentials:**

Sometimes a credential needs to be canceled — for example, if a degree is rescinded or an employment ends. This works like canceling a credit card — the card still physically exists, but it will be declined if anyone tries to use it.

---

### 3. Verifier Dashboard (Web Portal)

**Login:** `verifier@trustilock.dev` / `Verifier@123456`

The Verifier Dashboard is for organizations that need to check someone's credentials.

**Who uses it:** Loan officers, employers, landlords.

**Creating verification requests:**

1. Log into the Verifier Dashboard
2. Select what credentials you need (for example: education + income)
3. Specify which fields are required vs. optional
4. Click "Create Request" — the system generates a QR code or link
5. Send this to the person you need to verify

**Understanding the trust checks:**

Every credential goes through four checks:

| Check | What It Means | Analogy |
|---|---|---|
| **Trusted Issuer** | Is the organization on the approved list? | Is this diploma from an accredited university? |
| **Valid Signature** | Has the credential been tampered with? | Is the wax seal on this letter intact? |
| **Not Expired** | Is the credential still valid? | Is this ID card still within its validity period? |
| **Not Revoked** | Has the issuer canceled it? | Has this credit card been reported as canceled? |

All four checks must pass for the credential to be considered verified.

---

### 4. Trust Registry (Admin Portal)

**Login:** `admin@trustilock.dev` / `Admin@123456`

The Trust Registry is the backbone of trust. Without it, anyone could claim to be a university and issue fake degrees. It maintains a list of verified, approved issuers.

**Adding trusted issuers:**

1. Log into the Admin portal
2. Enter the issuer's DID (identifier), organization name, and which credential types they are authorized to issue
3. Changes take effect immediately

**Policies:**

The admin configures verification policies:

- **require-trusted-issuer** — The credential issuer must be in the trust registry
- **require-active-status** — The credential must not be revoked or suspended
- **require-non-expired** — The credential must not be past its expiry date

---

## Step-by-Step: Loan Application Example

### The Cast

- **National Technical University** — Issuer (education credentials)
- **TrustBank India** — Issuer (income credentials)
- **Sandhya** — Holder (the loan applicant)
- **HomeFirst Finance** — Verifier (the loan company)

---

**Step 1: University issues education credential to Sandhya**

National Technical University logs into the Issuer Dashboard (`issuer@trustilock.dev`) and creates an education credential:
- Institution: National Technical University
- Degree: Bachelor of Technology
- Field of Study: Computer Science
- GPA: 3.8
- Graduation Date: 2023-06-15

The system generates a QR code. Sandhya scans it with her TrustiLock app and accepts the credential.

**Step 2: Bank issues income credential to Sandhya**

TrustBank India creates an income credential:
- Employer: TrustBank India
- Job Title: Software Engineer
- Annual Income: 1,200,000 INR
- Employment Start Date: 2023-08-01

Sandhya scans the QR code and accepts.

**Step 3: Sandhya stores both in her wallet**

Sandhya now has two credential cards:
- A blue Education Credential from National Technical University
- A green Income Credential from TrustBank India

Both are stored securely (encrypted) on her phone.

**Step 4: Loan company requests verification**

HomeFirst Finance logs into the Verifier Dashboard (`verifier@trustilock.dev`) and creates a verification request asking for education and income credentials.

**Step 5: Sandhya selects what to share**

Sandhya scans the QR code with her app. She sees the request and unchecks GPA, Student ID, and Employee ID — she does not want to share those. She taps "Share."

**Step 6: Loan company verifies**

```
Education Credential (National Technical University):
  [PASS] Trusted Issuer    - National Technical University is in the trust registry
  [PASS] Valid Signature    - Credential has not been tampered with
  [PASS] Not Expired        - Credential is within validity period
  [PASS] Not Revoked        - Credential status is active

Income Credential (TrustBank India):
  [PASS] Trusted Issuer    - TrustBank India is in the trust registry
  [PASS] Valid Signature    - Credential has not been tampered with
  [PASS] Not Expired        - Credential is within validity period
  [PASS] Not Revoked        - Credential status is active

OVERALL RESULT: VERIFIED
```

**Step 7: Loan approved**

With both credentials verified, HomeFirst Finance approves Sandhya's loan. The entire process takes under a minute.

---

## Security and Privacy

### Your credentials are stored on YOUR phone

TrustiLock does not store your credentials on a central server. They live on your phone in encrypted storage. No one — not even TrustiLock — can access them without your phone.

### You choose what to share

Selective disclosure means you reveal only the specific pieces of information that are needed. You are in control.

### Credentials are cryptographically signed

Every credential is digitally signed by the issuer using strong cryptography (ES256 with P-256 curves). Think of this like a **tamper-proof wax seal** — if anyone changes even a single character, the seal breaks and verification fails.

### Revocation

If an issuer needs to invalidate a credential, they can revoke it at any time. This works like **canceling a credit card** — the credential still exists in your wallet, but any attempt to verify it will show that it has been revoked.

### No one can see your data without your consent

Every time someone asks for your credentials, you must explicitly approve the request. Nothing is ever shared automatically.

---

## Technical Details (For Developers)

### API

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8000` |
| Swagger Docs | `http://localhost:8000/api/docs` |
| Auth | JWT Bearer token (`Authorization: Bearer <token>`) |
| Response Format | `{ success, statusCode, data, timestamp }` |
| Error Format | `{ success: false, statusCode, error, message, timestamp, path }` |

### Authentication Endpoints

```
POST /auth/register   — Create account { email, password, name, role }
POST /auth/login      — Login { email, password } → { access_token, refresh_token, user }
POST /auth/refresh    — Refresh token { refresh_token } → new token pair
POST /auth/logout     — Invalidate tokens (requires Bearer token)
GET  /auth/me         — Current user profile (requires Bearer token)
POST /auth/api-keys   — Generate API key (admin only)
```

### Key Protocols

| Protocol | What It Does |
|---|---|
| **OID4VCI** | Credential issuance — how an issuer gives a credential to a holder |
| **OID4VP** | Credential presentation — how a holder shares credentials with a verifier |
| **SD-JWT-VC** | Credential format that enables selective disclosure |
| **Bitstring Status List** | W3C standard for tracking revocation/suspension |

### Quick Start

```bash
# 1. Clone and install
git clone <repository-url>
cd trustilock
pnpm install

# 2. Set up environment
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — set DATABASE_URL to your MongoDB Atlas connection string

# 3. No schema push needed — Mongoose schemas are defined in code and sync automatically

# 4. Seed default data (schemas, policies, users)
cd apps/api && pnpm exec tsx ../../infrastructure/seed/seed-data.ts && cd ../..

# 5. Start all services
pnpm dev

# 6. Open Swagger docs
# http://localhost:8000/api/docs

# 7. Login with default credentials
# admin@trustilock.dev / Admin@123456
```

### Running Tests

```bash
pnpm test        # 110 unit tests across 12 files
```

### Project Structure

```
trustilock/
  apps/
    api/          NestJS backend (auth, issuer, wallet, verifier, trust, status)
    web/          Next.js web portals (issuer, verifier, trust admin dashboards)
    mobile/       React Native + Expo wallet app
  packages/
    shared/       Shared TypeScript types and utilities
  infrastructure/
    seed/         Database seed scripts
    docker-compose.yml
  docs/
    USER_GUIDE.md          This file
    DEFAULT_CREDENTIALS.md Login details for all default accounts
```
