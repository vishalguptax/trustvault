# TrustVault --- User Journey & Features Guide

## 1. What is TrustVault?

TrustVault is a digital credential platform that allows organizations to issue tamper-proof digital documents --- such as diplomas, income letters, and identity cards --- and allows individuals to store, manage, and share those documents securely from their phone. Think of it as a **digital wallet for official documents**, just like your physical wallet holds your driver's license and bank cards. TrustVault solves three real-world problems: **fake credentials** (anyone can photoshop a diploma), **slow manual verification** (calling a university to confirm a degree takes days), and **privacy invasion** (having to hand over your entire transcript when a lender only needs to know you graduated).

## 2. The Four Actors

### Issuer (The Document Printer)

An Issuer is any organization that creates official credentials --- a university issuing diplomas, a bank confirming your income, or a government agency printing identity documents. In the physical world, this is the office where you pick up your stamped, signed certificate. In TrustVault, the issuer creates a digital version of that certificate, signs it with a cryptographic seal (like a tamper-proof wax stamp), and hands it to you through a QR code.

### Holder (You, the Document Owner)

The Holder is any person who receives and carries credentials. You already do this in the physical world --- your wallet contains your driver's license, your filing cabinet holds your diploma. In TrustVault, your phone becomes that wallet. You receive credentials by scanning QR codes, and you decide exactly what information to share when someone asks.

### Verifier (The Document Checker)

A Verifier is any organization that needs to confirm your credentials --- a loan company checking your income, an employer confirming your degree, or a landlord verifying your identity. In the physical world, this is the person behind the counter who asks to see your ID. In TrustVault, the verifier sends you a request, you choose what to share, and the system instantly confirms whether the documents are genuine.

### Trust Admin (The Accreditation Authority)

The Trust Admin maintains a registry of approved issuers --- the master list of organizations whose credentials can be trusted. In the physical world, this is like the government body that accredits universities. Without this registry, anyone could pretend to be a university and issue fake degrees. The Trust Admin decides who gets on the list and who gets removed.

### How They Work Together

```
  ISSUER                    HOLDER (You)                 VERIFIER
  (University)              (Phone Wallet)               (Loan Company)
      |                          |                            |
  1.  |--- Creates credential -->|                            |
      |    (you scan QR code)    |                            |
  2.  |                          |-- Stores in wallet         |
      |                          |                            |
  3.  |                          |<-- Requests proof ---------|
      |                          |                            |
  4.  |                          |-- Shares selected info --->|
      |                          |   (you pick what to show)  |
  5.  |                          |                            |-- Runs 4 checks:
      |                          |                            |   Trusted issuer?
      |                          |                            |   Signature valid?
      |                          |                            |   Not expired?
      |                          |                            |   Not revoked?
  6.  |                          |                            |-- RESULT: VERIFIED
      |                          |                            |
              TRUST ADMIN manages the list of approved issuers
```

## 3. Getting Started

### How to Access Each Portal

| Portal | URL | Who Uses It |
|--------|-----|-------------|
| Web Dashboard (Admin) | http://localhost:3000/login then redirects to /admin | Trust Registry administrators |
| Web Dashboard (Issuer) | http://localhost:3000/login then redirects to /issuer | Universities, banks, employers |
| Web Dashboard (Verifier) | http://localhost:3000/login then redirects to /verifier | Loan companies, employers, landlords |
| Mobile Wallet App | Expo Go on your phone (same WiFi network) | Credential holders (you) |
| API Documentation | http://localhost:8000/api/docs | Developers (Swagger UI) |

### Default Accounts

These accounts are created automatically when the system is set up for the first time.

| Email | Password | Role | What You Can Do |
|-------|----------|------|-----------------|
| `admin@trustvault.dev` | `Admin@123456` | Admin | Manage trust registry, create policies, full access to everything |
| `issuer@trustvault.dev` | `Issuer@123456` | Issuer | Create credential offers, view issued credentials, revoke or suspend |
| `verifier@trustvault.dev` | `Verifier@123456` | Verifier | Create verification requests, view verification results |
| `holder@trustvault.dev` | `Holder@123456` | Holder | Receive credentials, store in wallet, share with verifiers |

### Mobile App Setup

1. Install **Expo Go** on your phone from the App Store (iOS) or Play Store (Android).
2. Make sure your phone and computer are on the same WiFi network.
3. Start the TrustVault development server on your computer.
4. Scan the QR code shown in your terminal with Expo Go.
5. Log in with `holder@trustvault.dev` / `Holder@123456` or register a new account.

## 4. Feature Walkthrough --- Authentication

### Registration

Any person can create an account on TrustVault. On the web dashboard or mobile app, you provide:
- **Name** --- Your full name.
- **Email** --- Must be unique. This becomes your login username.
- **Password** --- Must be strong (uppercase, lowercase, number, special character).
- **Role** --- Choose holder (wallet user), issuer (organization), or verifier (checker).

After registering, you are immediately able to log in.

### Login

When you log in with your email and password, the system gives you a **temporary access pass** called a token. Think of it like a visitor badge at an office building --- it lets you through the doors, but it expires after a set time. In TrustVault:
- Your **access token** lasts 15 minutes. Every action you take uses this token.
- Your **refresh token** lasts 7 days. When your access token expires, the refresh token automatically gets you a new one without needing to type your password again.

### Role-Based Access (Who Sees What)

| Role | Can Access | Cannot Access |
|------|-----------|---------------|
| **Admin** | Everything --- trust registry, policies, all credentials, all endpoints | Nothing is restricted |
| **Issuer** | Credential offers, issued credentials list, revoke/suspend/reinstate | Trust registry management, policy creation |
| **Verifier** | Verification requests, verification results | Credential issuance, trust registry management |
| **Holder** | Wallet (receive, store, view, delete credentials), create presentations, consent history | Issuance, verification setup, admin tasks |

### Logout and Session Expiry

When you log out, all your tokens are invalidated immediately. Even if someone had a copy of your token, it would stop working. If you simply close the browser without logging out, your access token automatically expires after 15 minutes.

## 5. Feature Walkthrough --- Issuer Portal

**Login:** `issuer@trustvault.dev` / `Issuer@123456`

### Dashboard Overview

After logging in, the issuer lands on a dashboard showing key statistics: how many credentials have been issued, how many are active, how many have been revoked or suspended, and recent activity.

### Viewing Credential Schemas

TrustVault comes with three built-in credential types (schemas). A schema is a template that defines what information goes into a credential.

| Credential Type | Fields | Typical Issuer |
|----------------|--------|----------------|
| **Education** (VerifiableEducationCredential) | institutionName, degree, fieldOfStudy, graduationDate, gpa, studentId | University |
| **Income** (VerifiableIncomeCredential) | employerName, jobTitle, annualIncome, currency, employmentStartDate, employeeId | Bank or employer |
| **Identity** (VerifiableIdentityCredential) | fullName, dateOfBirth, nationality, documentNumber | Government agency |

Each schema also marks certain fields as "selectively disclosable" --- these are fields the holder can choose to hide when sharing. For example, GPA and studentId in an education credential are optional to disclose.

### Creating a Credential Offer (Step by Step)

1. Navigate to the **Create Offer** page (Offers > New).
2. **Select a schema** --- Choose Education, Income, or Identity from the dropdown.
3. **Enter the Subject DID** --- This is the digital identifier of the person receiving the credential. (The holder creates this in their wallet app.)
4. **Fill in the claims** --- These are the actual values for the credential fields. For example, for an education credential:
   - institutionName: "National Technical University"
   - degree: "Bachelor of Technology"
   - fieldOfStudy: "Computer Science"
   - graduationDate: "2023-06-15"
   - gpa: 3.8
   - studentId: "NTU-2019-CS-042"
5. **PIN protection** (optional) --- You can require the holder to enter a PIN when receiving the credential, adding an extra layer of security.
6. Click **Create Offer**.

The system generates a **pre-authorized code** (a one-time password for the credential) and a **QR code**. The holder scans this QR code with their phone to receive the credential. The offer expires after a set time if not claimed.

### QR Code Generation

Every credential offer produces a QR code containing a special URI (link). When the holder scans this code, their wallet app automatically begins the credential receiving process. The QR code can be displayed on screen or shared electronically.

### Viewing Issued Credentials

The **Credentials** page lists every credential the issuer has ever created, including:
- The credential type (Education, Income, Identity)
- The recipient's digital identifier (subject DID)
- The current status (active, revoked, or suspended)
- The date it was issued

### Revoking a Credential

Revocation permanently cancels a credential. Use this when:
- A degree is rescinded due to academic fraud.
- An employment relationship ends.
- A document was issued by mistake.

Revocation works like canceling a credit card --- the card still physically exists in the holder's wallet, but any attempt to verify it will fail. To revoke, select a credential and provide an optional reason (for example, "Credential compromised").

### Suspending and Reinstating

Suspension is a temporary hold. Unlike revocation, a suspended credential can be reinstated later. Use this when:
- A credential is under investigation but not yet confirmed as invalid.
- A temporary hold is needed during an audit.

To suspend, select a credential and provide an optional reason (for example, "Under investigation"). To reinstate, select the suspended credential and confirm. The credential returns to active status and will pass verification again.

## 6. Feature Walkthrough --- Digital Wallet (Mobile)

**Login:** `holder@trustvault.dev` / `Holder@123456`

### Home Screen (Credential Cards)

The home screen displays all your stored credentials as color-coded cards. Each card shows the credential type, the issuing organization, and the issue date. Tap any card to see full details.

### Receiving a Credential (Scan QR)

1. An issuer (for example, your university) creates a credential offer and shows you a QR code.
2. Open the TrustVault app and tap **Receive Credential** or the QR scanner icon.
3. Point your camera at the QR code.
4. Review the credential details displayed on screen.
5. Tap **Accept** to store it in your wallet.

Behind the scenes, the app exchanges a one-time code for a secure access token, then uses that token to download the signed credential. The entire process takes a few seconds.

### Viewing Credential Details

Tap any credential card to see all its fields, which organization issued it, when it was issued, and when it expires (if applicable). You can also see which fields are marked as selectively disclosable.

### Selective Disclosure Explained Simply

Imagine you are applying for a loan and the lender needs proof that you graduated from university. They do not need to know your GPA or student ID. With selective disclosure, **you choose exactly which pieces of information to reveal**. You share "degree" and "institution" but keep "GPA" and "studentId" private. The lender receives only what they need, and the rest remains hidden --- yet the credential is still verifiable as authentic.

### Creating a Presentation (Step by Step)

1. A verifier sends you a verification request (you scan their QR code or receive a link).
2. The app shows what the verifier is asking for --- which credential types and which specific fields.
3. **Required fields** are pre-checked and cannot be unchecked (the verifier needs these).
4. **Optional fields** have checkboxes you can toggle on or off.
5. Review your selections, then confirm by granting **consent** (tapping "Share").
6. The app creates a verifiable presentation containing only the fields you approved and sends it to the verifier.

### Consent History ("Who Did I Share With?")

Every time you share a credential, TrustVault records:
- **Who** you shared with (the verifier's identity)
- **When** you shared it (date and time)
- **What** you shared (which credentials and which specific fields)

You can view this complete history anytime from the **Consent History** section. Nothing is ever shared without your explicit approval.

### Managing DIDs (Your Digital Identity)

A DID (Decentralized Identifier) is your unique digital identity --- think of it like an email address, but one that you own completely and no company controls. Your wallet can create multiple DIDs. Each DID has a pair of cryptographic keys: a public key (shared openly, like your email address) and a private key (kept secret, like your password). You can create a new DID at any time from the wallet settings.

## 7. Feature Walkthrough --- Verifier Portal

**Login:** `verifier@trustvault.dev` / `Verifier@123456`

### Creating a Verification Request

1. Navigate to **Create Request** (Requests > New).
2. **Select credential types** --- Choose which credentials you need. For example, select both "VerifiableEducationCredential" and "VerifiableIncomeCredential" for a loan application.
3. **Specify required claims** (optional) --- List which specific fields you need from each credential type. For example, you might require "degree" and "institution" from the education credential.
4. **Select verification policies** --- Choose which checks to enforce:
   - **require-trusted-issuer** --- The credential must come from an approved organization.
   - **require-active-status** --- The credential must not be revoked or suspended.
   - **require-non-expired** --- The credential must not be past its expiry date.
5. Click **Create Request**. The system generates a unique QR code or link.
6. Display the QR code on screen or send the link to the person you need to verify.

### Generating QR Code for Holder

The verification request produces a QR code containing an authorization request URI. The holder scans this with their wallet app, which triggers the consent and sharing process. Each QR code has a unique nonce (random number) and state identifier to prevent replay attacks (someone trying to reuse an old verification).

### Understanding the 4 Verification Checks

Every credential presented to a verifier goes through four checks. All four must pass for the credential to be considered verified.

| Check | What It Means | Real-World Analogy |
|-------|---------------|-------------------|
| **Trusted Issuer** | Is the organization that created this credential on the approved list? | Is this diploma from an accredited university, or a diploma mill? |
| **Valid Signature** | Has the credential been altered since it was issued? | Is the wax seal on this official letter still intact, or has someone broken it open and changed the contents? |
| **Not Expired** | Is the credential still within its validity period? | Is this passport still valid, or did it expire last year? |
| **Not Revoked** | Has the issuer canceled this credential? | Has this credit card been reported as stolen and deactivated by the bank? |

### Viewing Verification Results

After the holder submits their presentation, the **Results** page shows:
- The overall outcome: VERIFIED or NOT VERIFIED.
- A breakdown of each credential, showing the result of each of the four checks.
- The disclosed claims --- only the fields the holder chose to share. Hidden fields are not visible.
- The date and time of the verification.

### Managing Verification Policies

Policies are rules that define what "verified" means. The admin can create custom policies with specific rules. The default policies are:
- **require-trusted-issuer** --- Reject credentials from issuers not in the trust registry.
- **require-active-status** --- Reject credentials that have been revoked or suspended.
- **require-non-expired** --- Reject credentials past their expiry date.

Verifiers select which policies apply when creating each verification request.

## 8. Feature Walkthrough --- Trust Registry (Admin)

**Login:** `admin@trustvault.dev` / `Admin@123456`

### What Trust Means in This System

Trust in TrustVault is not automatic. Just because someone issues a credential does not mean verifiers should accept it. The trust registry is a curated list of organizations that have been vetted and approved. When a verifier checks a credential, one of the first questions is: "Is the issuer on the approved list?" If the answer is no, the verification fails --- regardless of whether the credential itself is technically valid.

### Adding a Trusted Issuer

1. Navigate to **Trust Registry** > **Issuers**.
2. Click **Register Issuer**.
3. Fill in:
   - **DID** --- The issuer's unique digital identifier (for example, `did:key:z6Mk...`).
   - **Name** --- The organization's name (for example, "National Technical University").
   - **Credential Types** --- Which types of credentials this issuer is authorized to create (for example, "VerifiableEducationCredential"). An issuer can be approved for multiple types.
   - **Description** (optional) --- Additional information about the issuer.
4. Click **Register**. The issuer is immediately active and trusted.

### Removing or Updating an Issuer

- **Update** --- Change the issuer's name, authorized credential types, or status (active/inactive). Navigate to the issuer and click Edit.
- **Remove** --- Permanently delete the issuer from the registry. This takes effect immediately: any credentials issued by this organization will fail the "Trusted Issuer" check from that moment forward, even if they passed before.

### Managing Credential Types

Each trusted issuer is authorized for specific credential types. A university might be authorized for education credentials but not income credentials. The admin controls these assignments. If an issuer presents a credential type they are not authorized for, the trust check fails.

### Viewing Schemas

The admin can view all credential schemas in the system through the Trust Registry's schema listing. This shows the same three schemas available to issuers (Education, Income, Identity), along with their field definitions and selective disclosure settings.

### Impact of Trust Registry Changes on Verification

Changes to the trust registry take effect immediately:
- **Adding an issuer** --- Credentials from that issuer will start passing the trust check right away.
- **Removing an issuer** --- Credentials that previously passed will now fail. The credentials themselves have not changed, but the system no longer trusts the organization that issued them.
- **Changing authorized types** --- If you remove "VerifiableIncomeCredential" from a bank's authorized types, their income credentials will fail the trust check, but their other authorized credential types will still pass.

## 9. Feature Walkthrough --- Credential Lifecycle

Here is the complete life of a single credential, from creation to cancellation:

**Step 1 --- Schema Exists.** The system has a predefined template for education credentials, specifying which fields are required (institutionName, degree) and which are selectively disclosable (gpa, studentId).

**Step 2 --- Issuer Creates Offer.** National Technical University logs into the Issuer Portal and creates an education credential offer for Sandhya, filling in her degree details. The system generates a QR code with a one-time pre-authorized code.

**Step 3 --- Holder Receives.** Sandhya opens her wallet app and scans the QR code. The app exchanges the pre-authorized code for a temporary access token, then uses that token to download the signed credential from the issuer.

**Step 4 --- Stored in Wallet.** The credential is now securely stored on Sandhya's phone. It contains the issuer's digital signature, the claim values, and a reference to a status list (used later for revocation checks).

**Step 5 --- Verifier Requests.** HomeFirst Finance creates a verification request asking for an education credential. A QR code is generated and displayed on their screen.

**Step 6 --- Holder Shares (Selective Disclosure).** Sandhya scans the verifier's QR code. Her app shows what HomeFirst needs. She unchecks GPA and studentId. She taps "Share," and her app creates a presentation containing only the fields she approved.

**Step 7 --- Verification Passes.** HomeFirst's system runs all four checks: the issuer is in the trust registry (trusted), the signature is valid (untampered), the credential has not expired, and the status list confirms it has not been revoked. Result: VERIFIED.

**Step 8 --- Later: Credential Revoked.** Months later, the university discovers academic misconduct and revokes Sandhya's degree. The issuer logs in and revokes the credential, updating the status list.

**Step 9 --- Verification Now Fails.** If Sandhya tries to use the credential again, or if anyone re-verifies it, the "Not Revoked" check now fails. The credential still exists in her wallet, but it is no longer accepted by any verifier.

## 10. Complete Demo Scenario --- Loan Application

### The Cast

- **National Technical University** --- Issues education credentials
- **TrustBank India** --- Issues income credentials
- **Sandhya** --- The loan applicant (credential holder)
- **HomeFirst Finance** --- The loan company (verifier)

### Act 1: Admin Sets the Stage

The Trust Admin logs into the web dashboard at http://localhost:3000/login using `admin@trustvault.dev` / `Admin@123456`. They land on the Admin dashboard.

They navigate to the Trust Registry and register two issuers:
1. **National Technical University** with DID `did:key:zUniversity1` authorized for `VerifiableEducationCredential`.
2. **TrustBank India** with DID `did:key:zBank1` authorized for `VerifiableIncomeCredential`.

Both appear in the issuers list with status "active."

### Act 2: University Issues Education Credential

The university representative logs in at http://localhost:3000/login using `issuer@trustvault.dev` / `Issuer@123456`. They land on the Issuer dashboard.

They navigate to Schemas and confirm the Education schema is available. Then they go to Offers > New and fill in:
- Schema: VerifiableEducationCredential
- Subject DID: Sandhya's wallet DID
- Claims: institutionName = "National Technical University", degree = "Bachelor of Technology", fieldOfStudy = "Computer Science", graduationDate = "2023-06-15", gpa = 3.8, studentId = "NTU-2019-CS-042"

They click Create Offer. A QR code appears on screen.

### Act 3: Bank Issues Income Credential

Using the same Issuer Portal, the bank representative creates an income credential:
- Schema: VerifiableIncomeCredential
- Subject DID: Sandhya's wallet DID
- Claims: employerName = "TrustBank India", jobTitle = "Software Engineer", annualIncome = 1200000, currency = "INR", employmentStartDate = "2023-08-01", employeeId = "TBI-EMP-1042"

Another QR code appears.

### Act 4: Sandhya Receives Both Credentials

Sandhya opens the TrustVault mobile app and logs in with `holder@trustvault.dev` / `Holder@123456`. She taps Receive Credential and scans the university's QR code. The credential details appear; she reviews them and taps Accept. She repeats the process with the bank's QR code.

Her wallet now shows two credential cards:
- An Education Credential from National Technical University
- An Income Credential from TrustBank India

### Act 5: HomeFirst Creates Verification Request

The loan officer at HomeFirst Finance logs in at http://localhost:3000/login using `verifier@trustvault.dev` / `Verifier@123456`. They land on the Verifier dashboard.

They navigate to Requests > New and create a request:
- Credential Types: VerifiableEducationCredential, VerifiableIncomeCredential
- Policies: require-trusted-issuer, require-active-status, require-non-expired

A QR code appears on the loan officer's screen.

### Act 6: Sandhya Shares with Selective Disclosure

Sandhya scans HomeFirst's QR code. Her app shows what is being requested:

**Education Credential:**
- Required: institutionName, degree, fieldOfStudy, graduationDate
- Optional: gpa, studentId

**Income Credential:**
- Required: employerName, annualIncome, currency
- Optional: jobTitle, employeeId, employmentStartDate

Sandhya unchecks gpa, studentId, and employeeId --- she does not want to share those. She keeps jobTitle and employmentStartDate checked. She taps Share.

### Act 7: HomeFirst Sees the Result

The loan officer refreshes the Results page and clicks on the verification result:

```
Education Credential (National Technical University):
  [PASS] Trusted Issuer    - National Technical University is in the trust registry
  [PASS] Valid Signature    - Credential has not been tampered with
  [PASS] Not Expired        - Credential is within validity period
  [PASS] Not Revoked        - Credential status is active

  Disclosed fields: institutionName, degree, fieldOfStudy, graduationDate
  Hidden fields: gpa, studentId

Income Credential (TrustBank India):
  [PASS] Trusted Issuer    - TrustBank India is in the trust registry
  [PASS] Valid Signature    - Credential has not been tampered with
  [PASS] Not Expired        - Credential is within validity period
  [PASS] Not Revoked        - Credential status is active

  Disclosed fields: employerName, annualIncome, currency, jobTitle, employmentStartDate
  Hidden fields: employeeId

OVERALL RESULT: VERIFIED
```

The loan officer can see Sandhya's degree, institution, income, and employer --- but not her GPA, student ID, or employee ID. All eight checks passed. Loan approved.

### Act 8: Revocation and Re-Verification

Six months later, the university discovers academic misconduct. The university representative logs back into the Issuer Portal and navigates to the Credentials list. They find Sandhya's education credential, click Revoke, and enter the reason: "Academic integrity violation."

If Sandhya or anyone else tries to verify that education credential now, the result changes:

```
Education Credential (National Technical University):
  [PASS] Trusted Issuer    - National Technical University is in the trust registry
  [PASS] Valid Signature    - Credential has not been tampered with
  [PASS] Not Expired        - Credential is within validity period
  [FAIL] Not Revoked        - Credential has been revoked

OVERALL RESULT: NOT VERIFIED
```

The credential still exists in Sandhya's wallet, but it can no longer pass verification anywhere.

## 11. Security & Privacy Features

### On-Device Storage

Your credentials are stored on your phone, not on a central server. No one --- not even TrustVault's operators --- can access them without your device. This is like keeping your documents in a personal safe rather than leaving copies at every office you visit.

### Selective Disclosure

You choose exactly which fields to share. A concrete example: when applying for an apartment, the landlord needs proof of income but does not need your employee ID or job title. You share "annualIncome" and "employerName" while keeping everything else hidden. The landlord still gets a verified, trustworthy answer --- they just do not get information they do not need.

### Cryptographic Signatures (The Wax Seal)

Every credential is signed by the issuer using strong cryptography (ES256 with P-256 curves). Think of this like a tamper-proof wax seal on a medieval letter. If anyone changes even a single character in the credential --- a comma, a date, an income figure --- the seal breaks and the verification fails. It is mathematically impossible to forge.

### Revocation (The Canceled Credit Card)

Issuers can revoke credentials at any time using the Bitstring Status List (a W3C standard). This works like a canceled credit card: the physical card still exists, but swiping it anywhere will result in "DECLINED." Revocation is immediate --- the moment the issuer clicks Revoke, any subsequent verification will fail.

### Suspension (The Temporary Hold)

Unlike revocation, suspension is reversible. An issuer can place a temporary hold on a credential while investigating an issue, and reinstate it later if everything checks out. During suspension, the credential fails verification. After reinstatement, it passes again.

### Consent Tracking

Every time you share a credential, the system records your explicit consent: what you shared, with whom, when, and which specific fields. You can review this history at any time. Nothing is ever shared without your approval.

### Rate Limiting

The API enforces rate limits to prevent abuse. Too many requests from the same source in a short time will be temporarily blocked. This protects against automated attacks that try to guess passwords or flood the system.

### JWT Token Security

Authentication tokens expire after 15 minutes, limiting the damage if a token is intercepted. Refresh tokens last 7 days but are invalidated upon logout. Tokens are cryptographically signed so they cannot be forged.

### Password Hashing

Passwords are never stored in plain text. They are hashed using industry-standard algorithms before being saved to the database. Even if someone accessed the database directly, they would not be able to read any passwords.

## 12. API Endpoints Reference (Simplified)

All endpoints use the base URL `http://localhost:8000`. Protected endpoints require a Bearer token obtained by logging in.

### Authentication

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /auth/register | Public | Create a new user account |
| POST | /auth/login | Public | Log in and receive access and refresh tokens |
| POST | /auth/refresh | Public | Exchange a refresh token for a new token pair |
| POST | /auth/logout | Protected (any role) | Log out and invalidate all tokens |
| GET | /auth/me | Protected (any role) | Get the currently logged-in user's profile |
| POST | /auth/api-keys | Protected (admin only) | Generate a new API key for programmatic access |

### Issuer

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /issuer/.well-known/openid-credential-issuer | Public | Get issuer metadata for the OID4VCI protocol |
| POST | /issuer/offers | Protected (issuer, admin) | Create a new credential offer with QR code |
| POST | /issuer/token | Public | Exchange a pre-authorized code for an access token |
| POST | /issuer/credential | Public | Issue a verifiable credential using an OID4VCI token |
| GET | /issuer/schemas | Public | List all available credential schemas |
| GET | /issuer/schemas/:id | Public | Get details for a specific credential schema |
| GET | /issuer/credentials | Protected (issuer, admin) | List all credentials issued by this issuer |

### Wallet

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /wallet/credentials/receive | Protected (holder, admin) | Receive a credential by providing a credential offer URI |
| GET | /wallet/credentials | Protected (holder, admin) | List all credentials stored in the wallet |
| GET | /wallet/credentials/:id | Protected (holder, admin) | Get full details of a specific credential |
| GET | /wallet/credentials/:id/claims | Protected (holder, admin) | View disclosed and undisclosed claims for a credential |
| DELETE | /wallet/credentials/:id | Protected (holder, admin) | Remove a credential from the wallet |
| POST | /wallet/presentations/create | Protected (holder, admin) | Create a verifiable presentation with selective disclosure |
| GET | /wallet/consent/history | Protected (holder, admin) | View the complete history of consent and sharing events |
| POST | /wallet/dids | Protected (holder, admin) | Create a new digital identifier (DID) for the wallet |

### Verifier

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| POST | /verifier/presentations/request | Protected (verifier, admin) | Create a new verification request with QR code |
| POST | /verifier/presentations/response | Public | Submit a verifiable presentation (called by the wallet) |
| GET | /verifier/presentations/:id | Protected (verifier, admin) | Get the result of a specific verification |
| POST | /verifier/policies | Protected (admin only) | Create a new verification policy with custom rules |
| GET | /verifier/policies | Public | List all available verification policies |

### Trust Registry

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /trust/schemas | Public | List all credential schemas |
| GET | /trust/issuers | Public | List all trusted issuers in the registry |
| GET | /trust/issuers/:did | Public | Get details for a specific trusted issuer |
| POST | /trust/issuers | Protected (admin only) | Register a new trusted issuer |
| PUT | /trust/issuers/:did | Protected (admin only) | Update a trusted issuer's name, types, or status |
| DELETE | /trust/issuers/:did | Protected (admin only) | Remove a trusted issuer from the registry |
| GET | /trust/verify | Public | Check whether an issuer is trusted for a credential type |

### Status (Revocation and Suspension)

| Method | Path | Access | Description |
|--------|------|--------|-------------|
| GET | /status/lists/:id | Public | Get a Bitstring Status List credential (W3C format) |
| POST | /status/revoke | Protected (issuer, admin) | Permanently revoke a credential |
| POST | /status/suspend | Protected (issuer, admin) | Temporarily suspend a credential |
| POST | /status/reinstate | Protected (issuer, admin) | Reinstate a previously suspended credential |
