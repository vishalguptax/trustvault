# TrustVault User Guide

## What is TrustVault?

TrustVault is a digital credential platform that lets organizations issue tamper-proof digital documents (like diplomas, income letters, and ID cards) and lets individuals store, manage, and share those documents from their phone. Think of it as a **digital wallet for official documents** — just like your physical wallet holds your driver's license and bank cards, TrustVault holds verified digital versions of your important documents that anyone can instantly verify as authentic.

---

## How It Works (The Big Picture)

TrustVault has four actors that work together:

| Actor | Who They Are | Real-World Analogy |
|---|---|---|
| **Issuer** | An organization that creates credentials (a university, bank, or government agency) | The office that prints your diploma or pay stub |
| **Holder** | You — the person who receives and stores credentials | You, carrying documents in your wallet |
| **Verifier** | An organization that needs to check your credentials (a loan company, employer, or landlord) | The person at the counter who asks to see your ID |
| **Trust Registry** | A list of approved issuers that verifiers can trust | The government list of accredited universities |

### The Flow

Here is how a credential moves through the system:

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
3. Open the TrustVault app on your phone
4. Tap "Receive Credential" and point your camera at the QR code
5. Review the credential details on screen
6. Tap "Accept" to store it in your wallet

**How to view your credentials:**

1. Open the TrustVault app
2. Your home screen shows all stored credentials as cards
3. Tap any card to see full details — issuer name, issue date, expiry, and all the claims (like degree name, GPA, income amount)

**How to share credentials (selective disclosure):**

When a verifier asks for proof, you do not have to share everything. For example, a loan company might need to know your income amount but does not need your employee ID. This is called **selective disclosure** — you pick exactly which pieces of information to reveal.

1. A verifier sends a verification request (you scan their QR code or receive a link)
2. The app shows you what they are asking for
3. You see checkboxes next to each piece of information
4. Required items are pre-checked (you cannot uncheck these)
5. Optional items are yours to include or exclude
6. Tap "Share" to send only what you approved

**Consent tracking:**

Every time you share a credential, the app records:
- What you shared
- Who you shared it with
- When you shared it
- Which specific details you disclosed

You can view this history anytime in the app.

---

### 2. Issuer Dashboard (Web Portal)

The Issuer Dashboard is a web-based control panel for organizations that issue credentials.

**Who uses it:** Universities, banks, employers, government agencies — any organization that certifies facts about a person.

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

**Tracking issued credentials:**

The dashboard shows a list of all credentials you have issued, including:
- Who received it (holder identifier)
- When it was issued
- Current status (active, revoked, or suspended)

**Revoking credentials:**

Sometimes a credential needs to be canceled — for example, if a degree is rescinded or an employment ends. To revoke:

1. Find the credential in your issued list
2. Click "Revoke"
3. The credential is immediately marked as invalid
4. Any future verification of this credential will fail the status check

This works like canceling a credit card — the card still physically exists, but it will be declined if anyone tries to use it.

---

### 3. Verifier Dashboard (Web Portal)

The Verifier Dashboard is for organizations that need to check someone's credentials before making a decision.

**Who uses it:** Loan officers, employers running background checks, landlords verifying income, any organization that needs proof.

**Creating verification requests:**

1. Log into the Verifier Dashboard
2. Select what credentials you need (for example: education + income)
3. Specify which fields are required vs. optional
4. Click "Create Request" — the system generates a QR code or link
5. Send this to the person you need to verify, or display the QR code for them to scan

**Viewing verification results:**

After a holder shares their credentials, the dashboard shows a detailed verification report:

- **Holder information:** The disclosed claims (only what the holder chose to share)
- **Verification checks:** A pass/fail list of every security check performed
- **Overall result:** Verified or Not Verified

**Understanding the trust checks:**

Every credential goes through four checks:

| Check | What It Means | Analogy |
|---|---|---|
| **Trusted Issuer** | Is the organization that issued this credential on the approved list? | Is this diploma from an accredited university? |
| **Valid Signature** | Has the credential been tampered with since it was issued? | Is the wax seal on this letter intact? |
| **Not Expired** | Is the credential still within its validity period? | Is this ID card still valid or has it expired? |
| **Not Revoked** | Has the issuer canceled this credential? | Has this credit card been reported as canceled? |

All four checks must pass for the credential to be considered verified.

---

### 4. Trust Registry (Admin Portal)

The Trust Registry is the backbone of trust in the system. It is an **approved list** that determines which issuers are considered legitimate.

**What it is:**

Without the Trust Registry, anyone could claim to be a university and issue fake degrees. The Trust Registry solves this by maintaining a list of verified, approved issuers. When a verifier checks a credential, one of the first things they check is: "Is the issuer on the approved list?"

**Who uses it:** Platform administrators who are responsible for maintaining trust in the ecosystem.

**Adding/removing trusted issuers:**

1. Log into the Trust Admin portal
2. To add an issuer: Enter the issuer's identifier (DID), organization name, and which credential types they are authorized to issue
3. To remove an issuer: Find them in the list and revoke their trusted status
4. Changes take effect immediately — any future verifications will use the updated list

**Managing credential types:**

The admin can define what types of credentials exist in the system and what fields each type contains. The current types are:

- **VerifiableEducationCredential** — for academic qualifications
- **VerifiableIncomeCredential** — for employment and income
- **VerifiableIdentityCredential** — for government-issued identity

**Policies:**

The admin configures verification policies that determine what checks are required:

- **require-trusted-issuer** — The credential issuer must be in the trust registry
- **require-active-status** — The credential must not be revoked or suspended
- **require-non-expired** — The credential must not be past its expiry date

---

## Step-by-Step: Loan Application Example

This walks through a complete real-world scenario where Sandhya applies for a home loan.

### The Cast

- **National Technical University** — Issuer (education credentials)
- **TrustBank India** — Issuer (income credentials)
- **Sandhya** — Holder (the loan applicant)
- **HomeFirst Finance** — Verifier (the loan company)
- **Trust Registry** — Already configured with both issuers as trusted

---

**Step 1: University issues education credential to Sandhya**

National Technical University logs into the Issuer Dashboard and creates an education credential for Sandhya:
- Institution: National Technical University
- Degree: Bachelor of Technology
- Field of Study: Computer Science
- GPA: 3.8
- Graduation Date: 2023-06-15

The system generates a QR code. Sandhya scans it with her TrustVault app and accepts the credential. It now appears as a blue card in her wallet.

**Step 2: Bank issues income credential to Sandhya**

TrustBank India creates an income credential:
- Employer: TrustBank India
- Job Title: Software Engineer
- Annual Income: 1,200,000
- Currency: INR
- Employment Start Date: 2023-08-01

Sandhya scans the QR code and accepts. A green card appears in her wallet.

**Step 3: Sandhya stores both in her wallet**

Sandhya now has two credential cards in her TrustVault app:
- A blue Education Credential from National Technical University
- A green Income Credential from TrustBank India

Both are stored securely (encrypted) on her phone.

**Step 4: Loan company requests verification**

HomeFirst Finance needs to verify Sandhya's education and income before approving her loan. A loan officer logs into the Verifier Dashboard and creates a verification request asking for:
- Education credential (required fields: institution, degree)
- Income credential (required fields: employer, annual income, currency)

The system generates a QR code. The loan officer displays it on screen or sends Sandhya a link.

**Step 5: Sandhya selects what to share (selective disclosure)**

Sandhya scans the QR code with her app. She sees the request:

> HomeFirst Finance is asking for:
> - Education: Institution (required), Degree (required), GPA (optional), Student ID (optional)
> - Income: Employer (required), Annual Income (required), Currency (required), Job Title (optional), Employee ID (optional)

Sandhya unchecks GPA, Student ID, and Employee ID — she does not want to share those. She keeps Job Title checked because she wants to. She taps "Share."

**Step 6: Loan company verifies**

HomeFirst Finance receives Sandhya's presentation. The system automatically runs four checks on each credential:

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

The loan officer sees only the fields Sandhya chose to share — no GPA, no student ID, no employee ID.

**Step 7: Loan approved**

With both credentials verified and all checks passing, HomeFirst Finance has the confidence to approve Sandhya's loan application. The entire process — from scanning QR codes to getting a verified result — takes under a minute.

---

## Security and Privacy

### Your credentials are stored on YOUR phone

TrustVault does not store your credentials on a central server. They live on your phone in encrypted storage. No one — not even TrustVault — can access them without your phone.

### You choose what to share

Selective disclosure means you reveal only the specific pieces of information that are needed. If a verifier only needs to know your degree and institution, they do not get to see your GPA, student ID, or any other detail. You are in control.

### Credentials are cryptographically signed

Every credential is digitally signed by the issuer using strong cryptography (ES256 with P-256 curves). Think of this like a **tamper-proof wax seal** on a medieval letter — if anyone changes even a single character of the credential, the seal breaks, and the verification fails. It is mathematically impossible to forge.

### Revocation

If an issuer needs to invalidate a credential (for example, a degree is rescinded), they can revoke it at any time. This works like **canceling a credit card** — the credential still exists in your wallet, but any attempt to verify it will show that it has been revoked. TrustVault uses a standard called Bitstring Status List to track revocation efficiently.

### No one can see your data without your consent

Every time someone asks for your credentials, you must explicitly approve the request. You see exactly what they are asking for, you choose what to share, and you tap "Share" to confirm. Nothing is ever shared automatically or without your knowledge.

---

## Technical Details (For Developers)

### API Base URL

```
Development:  http://localhost:3000
```

All API endpoints are prefixed with `/api`.

### Authentication

- **Mobile wallet:** JWT-based authentication. Obtain a token via the wallet auth endpoint and include it in the `Authorization: Bearer <token>` header.
- **Web dashboards:** API key authentication for service-to-service calls between the Next.js frontend and the NestJS backend.

### Swagger Documentation

Interactive API documentation is available at:

```
http://localhost:3000/api/docs
```

This provides a complete list of all endpoints, request/response schemas, and the ability to test API calls directly from the browser.

### Key Protocols

| Protocol | What It Does | Specification |
|---|---|---|
| **OID4VCI** | OpenID for Verifiable Credential Issuance — the protocol used when an issuer gives a credential to a holder | [OpenID4VCI Spec](https://openid.net/specs/openid-4-verifiable-credential-issuance-1_0.html) |
| **OID4VP** | OpenID for Verifiable Presentations — the protocol used when a holder shares credentials with a verifier | [OpenID4VP Spec](https://openid.net/specs/openid-4-verifiable-presentations-1_0.html) |
| **SD-JWT-VC** | Selective Disclosure JWT Verifiable Credentials — the credential format that enables sharing only specific fields | [SD-JWT-VC Spec](https://www.ietf.org/archive/id/draft-ietf-oauth-sd-jwt-vc-05.html) |
| **Bitstring Status List** | W3C standard for tracking which credentials have been revoked or suspended | [W3C Status List](https://www.w3.org/TR/vc-bitstring-status-list/) |

### Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd trustvault

# 2. Install dependencies (pnpm only)
pnpm install

# 3. Set up environment
#    Copy .env.example to .env in apps/api/
#    Set DATABASE_URL to your MongoDB Atlas connection string

# 4. Generate Prisma client
npx prisma generate --schema=apps/api/prisma/schema.prisma

# 5. Push schema to database
npx prisma db push --schema=apps/api/prisma/schema.prisma

# 6. Start all services (API + Web + Mobile)
pnpm dev

# 7. Open Swagger docs
#    Navigate to http://localhost:3000/api/docs
```

### Project Structure

```
trustvault/
  apps/
    api/          NestJS backend (issuer, wallet, verifier, trust, status modules)
    web/          Next.js web portals (issuer, verifier, trust admin dashboards)
    mobile/       React Native + Expo wallet app
  packages/
    shared/       Shared TypeScript types and utilities
  infrastructure/
    seed/         Database seed scripts (demo issuers, schemas, policies)
    docker-compose.yml
```

### Running Tests

```bash
pnpm test          # Unit tests
pnpm test:e2e      # End-to-end test scenarios (5 mandatory scenarios)
```

### Building for Production

```bash
pnpm build                                              # Build all apps
docker compose -f infrastructure/docker-compose.yml up --build  # Run via Docker
```
