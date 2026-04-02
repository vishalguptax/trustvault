# TrustVault — Production Onboarding Guide

## How Organizations Join the TrustVault Ecosystem

---

## 1. Overview

TrustVault is an open ecosystem. Any organization can participate in one or more roles:

| Role | What They Do | Example |
|---|---|---|
| **Issuer** | Issues verifiable credentials to holders | Banks, universities, government agencies |
| **Verifier** | Requests and verifies credentials from holders | Loan companies, employers, embassies |
| **Holder** | Receives, stores, and presents credentials | Individual users (via wallet) |

This document defines the onboarding process for **Issuers** and **Verifiers**. Holders self-onboard by downloading a wallet.

---

## 2. Governance Models

Someone must decide who is trusted. TrustVault supports multiple governance models:

| Model | Who Decides | Best For | Example |
|---|---|---|---|
| **Platform-run** | TrustVault operator | Early-stage, single-org deployment | You manually approve issuers |
| **Consortium** | Industry body | Sector-specific trust | RBI approves banks, UGC approves universities |
| **Government-run** | Government authority | National identity programs | MeitY/UIDAI for India, Member State for EU eIDAS |
| **Federated** | Multiple trust anchors | Multi-sector ecosystems | Different governance per sector |
| **Open + Automated** | Self-service with verification | Large-scale open ecosystems | Domain verification (like SSL issuance) |

### Recommended Progression

```
Phase 1 (Launch)     → Platform-run (you approve manually)
Phase 2 (Pilot)      → Consortium (partner with sector bodies)
Phase 3 (Scale)      → Federated (sector-specific governance)
Phase 4 (Ecosystem)  → Open + Automated (self-service onboarding)
```

---

## 3. Issuer Onboarding Process

### 3.1 Process Flow

```
┌──────────────────┐
│  1. Application   │  Organization submits onboarding request
└────────┬─────────┘
         ▼
┌──────────────────┐
│  2. Verification  │  Identity, legal standing, domain ownership
└────────┬─────────┘
         ▼
┌──────────────────┐
│  3. Legal Agreement│  Trust Framework Agreement signed
└────────┬─────────┘
         ▼
┌──────────────────┐
│  4. DID Setup     │  Issuer creates did:web on their domain
└────────┬─────────┘
         ▼
┌──────────────────┐
│  5. Schema Agreement│  Agree on credential types, claims, SD policies
└────────┬─────────┘
         ▼
┌──────────────────┐
│  6. Technical     │  Integrate OID4VCI, set up signing keys
│     Integration   │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  7. Testing       │  Interoperability testing in sandbox
└────────┬─────────┘
         ▼
┌──────────────────┐
│  8. Certification │  Security audit, compliance check
└────────┬─────────┘
         ▼
┌──────────────────┐
│  9. Go-Live       │  Added to Trust Registry, start issuing
└────────┬─────────┘
         ▼
┌──────────────────┐
│ 10. Monitoring    │  Ongoing compliance, key rotation, audits
└──────────────────┘
```

### 3.2 Step-by-Step Details

#### Step 1: Application

Organization submits an onboarding request:

```json
{
  "organizationName": "State Bank of India",
  "registrationNumber": "L65191MH1955GOI028773",
  "country": "IN",
  "sector": "banking",
  "website": "https://sbi.co.in",
  "contactPerson": {
    "name": "...",
    "email": "...",
    "designation": "Chief Digital Officer"
  },
  "requestedRole": "issuer",
  "credentialTypesRequested": [
    "VerifiableIncomeCredential",
    "VerifiableAccountCredential"
  ],
  "estimatedIssuanceVolume": "100,000/month",
  "complianceCertifications": ["ISO 27001", "PCI DSS", "RBI Guidelines"]
}
```

**TODO (Manual):** Design the application form (web form or API endpoint).

---

#### Step 2: Verification

Verify the organization is who they claim to be:

| Check | Method | Evidence |
|---|---|---|
| **Legal existence** | Business registration lookup | MCA (India), Companies House (UK), SEC (US) |
| **Domain ownership** | DNS TXT record verification | Add TXT record `trustvault-verify=<token>` to their DNS |
| **Sector authorization** | Regulatory license check | RBI license for banks, UGC recognition for universities, UIDAI authorization for identity |
| **Contact verification** | Email verification + video call | Verify contact person is authorized representative |
| **Security posture** | Self-assessment questionnaire | ISO 27001, SOC 2, or equivalent |

**Verification Levels:**

| Level | Checks Required | Use Case |
|---|---|---|
| **Basic** | Legal existence + domain ownership | Low-assurance credentials |
| **Enhanced** | Basic + sector authorization + security questionnaire | Standard credentials |
| **Qualified** | Enhanced + on-site audit + HSM verification | Government ID, financial credentials (eIDAS LoA High) |

**TODO (Manual):** Define which verification level is required for which credential type.

---

#### Step 3: Legal Agreement — Trust Framework Agreement

Both parties sign a Trust Framework Agreement covering:

```
TRUST FRAMEWORK AGREEMENT

1. CREDENTIAL TYPES
   - Issuer is authorized to issue: [list of credential types]
   - Issuer MUST NOT issue credential types not listed

2. DATA QUALITY
   - Issuer ensures all claims are accurate at time of issuance
   - Issuer maintains source records for audit purposes
   - Data must come from authoritative sources (not self-reported)

3. KEY MANAGEMENT
   - Signing keys MUST be stored in HSM (FIPS 140-2 Level 2+)
   - Key rotation: at least every 24 months
   - Compromised key: revoke all affected credentials within 24 hours
   - Notify TrustVault governance within 1 hour of key compromise

4. REVOCATION
   - Issuer MUST revoke credentials when underlying facts change
   - Revocation must be reflected in status list within 1 hour
   - Issuer maintains revocation capability for credential lifetime

5. PRIVACY
   - Support selective disclosure (SD-JWT-VC)
   - Do not embed unnecessary PII in credentials
   - Comply with applicable data protection laws (DPDP Act, GDPR)

6. AVAILABILITY
   - Status list endpoints: 99.9% uptime SLA
   - DID document hosting: 99.9% uptime SLA
   - Issuance service: 99.5% uptime SLA

7. LIABILITY
   - Issuer is liable for accuracy of issued credentials
   - TrustVault is not liable for issuer's data quality
   - Dispute resolution: [arbitration/mediation clause]

8. TERMINATION
   - Either party may terminate with 90 days notice
   - On termination: issuer removed from trust registry
   - Existing credentials remain valid until expiry (but trust check fails)

9. AUDIT
   - Annual compliance audit (self-assessment or third-party)
   - TrustVault may request ad-hoc audit with 30 days notice
```

**TODO (Manual):** Get legal team to draft the actual agreement. This is a template.

---

#### Step 4: DID Setup

Issuer creates their DID on their own infrastructure:

**Option A: did:web (Recommended for production)**
```
Issuer: State Bank of India
DID: did:web:sbi.co.in

Steps:
1. Issuer generates ES256 key pair (on their HSM)
2. Issuer creates DID document:
   {
     "@context": ["https://www.w3.org/ns/did/v1"],
     "id": "did:web:sbi.co.in",
     "verificationMethod": [{
       "id": "did:web:sbi.co.in#key-1",
       "type": "JsonWebKey2020",
       "controller": "did:web:sbi.co.in",
       "publicKeyJwk": { ... }
     }],
     "authentication": ["did:web:sbi.co.in#key-1"],
     "assertionMethod": ["did:web:sbi.co.in#key-1"]
   }
3. Issuer hosts at: https://sbi.co.in/.well-known/did.json
4. TrustVault resolves the DID to verify
```

**Option B: did:key (For testing/sandbox)**
```
TrustVault generates a did:key for the issuer during sandbox testing.
Production MUST use did:web.
```

**Key point:** The issuer controls their own keys. TrustVault NEVER has access to issuer's private keys.

**TODO (Manual):** Provide issuer with a DID setup guide and onboarding SDK.

---

#### Step 5: Credential Schema Agreement

Both parties agree on the credential structure:

```json
{
  "credentialType": "VerifiableIncomeCredential",
  "version": "1.0",
  "issuer": "did:web:sbi.co.in",

  "claims": {
    "alwaysDisclosed": {
      "currency": { "type": "string", "description": "ISO 4217 currency code" }
    },
    "selectivelyDisclosable": {
      "holderName": { "type": "string" },
      "annualIncome": { "type": "number" },
      "employer": { "type": "string" },
      "employmentType": { "type": "string", "enum": ["full-time", "part-time", "contract"] },
      "employmentSince": { "type": "string", "format": "date" },
      "accountNumber": { "type": "string" }
    }
  },

  "policies": {
    "maxValidity": "365 days",
    "revocationRequired": true,
    "statusListEndpoint": "https://sbi.co.in/credentials/status/1"
  }
}
```

**TODO (Manual):** For each credential type, document the agreed schema and SD policies.

---

#### Step 6: Technical Integration

Two integration models:

**Model A: Issuer runs their own OID4VCI server**
```
Issuer deploys:
  - OID4VCI endpoints on their infrastructure
  - Uses TrustVault's open-source issuer SDK (@trustvault/issuer-sdk)
  - Signs credentials with their own HSM
  - Publishes status lists on their own domain

TrustVault provides:
  - TypeScript/Java/Python SDK for OID4VCI
  - Integration guide
  - Sandbox environment for testing
  - Conformance test suite
```

**Model B: Issuer uses TrustVault as a service (White-label)**
```
Issuer uses TrustVault's hosted issuer service:
  - TrustVault provides API: POST /api/v1/issue
  - Issuer sends claim data
  - TrustVault signs with issuer's key (held in shared HSM partition)
  - TrustVault manages OID4VCI endpoints

  Note: Issuer's HSM partition is isolated. TrustVault operators cannot extract keys.
```

**Integration Checklist:**
- [ ] OID4VCI metadata endpoint responds correctly
- [ ] Pre-authorized code flow works end-to-end
- [ ] SD-JWT-VC structure matches agreed schema
- [ ] Holder key binding (cnf claim) included
- [ ] Status list endpoint accessible and valid
- [ ] Credential expiry set correctly

**TODO (Manual):** Decide which integration model to support first. Provide SDK and documentation.

---

#### Step 7: Testing (Sandbox)

```
Sandbox Environment:
  - Separate MongoDB instance with test data
  - Separate trust registry (sandbox issuers only)
  - No real PII — use synthetic test data
  - Test wallet available for interop testing

Test Suite:
  1. Issue 10 credentials → verify all are valid
  2. Revoke 1 credential → verify it fails validation
  3. Present credential with selective disclosure → verify only disclosed claims visible
  4. Cross-verify: TrustVault wallet ↔ issuer endpoint interoperability
  5. Load test: issue 1000 credentials in 10 minutes
  6. Key rotation: rotate issuer key → old credentials still verify with old key
```

**TODO (Manual):** Set up sandbox environment. Create test data generator.

---

#### Step 8: Certification

| Check | Requirement | Evidence |
|---|---|---|
| Security audit | No critical/high vulnerabilities | Penetration test report |
| Key management | HSM with FIPS 140-2 Level 2+ | HSM certification document |
| Availability | Status list endpoint 99.9% uptime | Monitoring dashboard / SLA commitment |
| Interoperability | Passes conformance test suite | Test suite report |
| Privacy | Selective disclosure working correctly | Test results |
| Revocation | Revocation reflected within 1 hour | Demonstrated in sandbox |

**TODO (Manual):** Define certification criteria per credential type / assurance level.

---

#### Step 9: Go-Live

```
Go-Live Checklist:
  - [ ] All certification checks passed
  - [ ] Legal agreement signed
  - [ ] DID document hosted and resolvable
  - [ ] Status list endpoint live and monitored
  - [ ] Issuer added to production Trust Registry:

        POST /trust/issuers
        {
          "did": "did:web:sbi.co.in",
          "name": "State Bank of India",
          "credentialTypes": ["VerifiableIncomeCredential"],
          "verificationLevel": "enhanced",
          "agreementRef": "TFA-2026-0042",
          "certifiedAt": "2026-04-15T00:00:00Z"
        }

  - [ ] Announcement to ecosystem participants
  - [ ] Monitoring alerts configured
```

---

#### Step 10: Ongoing Monitoring

| Activity | Frequency | Action |
|---|---|---|
| Uptime monitoring | Continuous | Alert if status list or DID endpoint goes down |
| Compliance audit | Annual | Self-assessment + optional third-party audit |
| Key rotation | Every 24 months max | Issuer rotates keys, notifies TrustVault |
| Credential quality | Quarterly | Sample verification of issued credentials |
| Incident response | As needed | Coordinated disclosure for key compromise / data breach |
| Agreement renewal | Annual | Review and renew Trust Framework Agreement |

---

## 4. Verifier Onboarding Process

### 4.1 Process Flow

```
┌──────────────────┐
│  1. Registration  │  Verifier declares what they need and why
└────────┬─────────┘
         ▼
┌──────────────────┐
│  2. Purpose       │  Review: is the data request proportionate?
│     Review        │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  3. Agreement     │  Sign Relying Party Agreement
└────────┬─────────┘
         ▼
┌──────────────────┐
│  4. Technical     │  Integrate OID4VP, configure policies
│     Integration   │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  5. Go-Live       │  Added to verifier registry
└──────────────────┘
```

### 4.2 Step-by-Step Details

#### Step 1: Registration

Verifier submits:

```json
{
  "organizationName": "HomeFirst Finance",
  "website": "https://homefirst.com",
  "sector": "financial-services",
  "requestedRole": "verifier",
  "credentialRequests": [
    {
      "credentialType": "VerifiableIncomeCredential",
      "requiredClaims": ["annualIncome", "currency"],
      "optionalClaims": ["employer", "employmentType"],
      "purpose": "Loan eligibility assessment — verify applicant income meets minimum threshold",
      "retentionPolicy": "Verification result stored for 7 years (RBI audit requirement). Raw credential claims deleted after 30 days.",
      "legalBasis": "Contractual necessity (loan application)"
    },
    {
      "credentialType": "VerifiableEducationCredential",
      "requiredClaims": ["degree", "institution"],
      "purpose": "Education loan — verify degree for loan product eligibility",
      "retentionPolicy": "Deleted after loan decision (max 90 days)",
      "legalBasis": "Contractual necessity"
    }
  ]
}
```

**TODO (Manual):** Design the verifier registration form.

---

#### Step 2: Purpose Review

A governance body (or platform admin) reviews:

| Question | Check |
|---|---|
| Is the data request **proportionate**? | Don't ask for full DOB if you only need "over 18" |
| Does the verifier have **legitimate purpose**? | Loan company asking for income = legitimate. Random company asking for income = not legitimate |
| Is the **retention policy** acceptable? | Don't store credential data longer than necessary |
| Is there a **legal basis**? | Consent, contractual necessity, legal obligation, etc. |

**Rejection examples:**
- Social media app requesting income credentials → rejected (no legitimate purpose)
- Employer requesting medical credentials for non-health role → rejected (disproportionate)
- Verifier with no data retention policy → rejected until policy provided

**TODO (Manual):** Define review criteria and approval workflow.

---

#### Step 3: Relying Party Agreement

```
RELYING PARTY AGREEMENT

1. DATA MINIMIZATION
   - Verifier MUST only request claims listed in approved registration
   - Verifier MUST NOT request additional claims without re-approval

2. PURPOSE LIMITATION
   - Data used ONLY for stated purpose
   - No secondary use, no sharing with third parties

3. RETENTION
   - Store verification result (pass/fail) as needed
   - Delete raw credential claims per stated retention policy
   - Never store the raw SD-JWT-VC long-term

4. TRANSPARENCY
   - Wallet MUST display: verifier name, requested claims, stated purpose
   - Verifier MUST provide privacy policy URL

5. USER CONSENT
   - Holder must explicitly consent before credential is shared
   - Verifier must respect denial (no service degradation beyond what data absence requires)

6. SECURITY
   - TLS 1.3 for all endpoints
   - No logging of raw credential data
   - Incident reporting within 24 hours

7. AUDIT
   - Annual compliance check
   - TrustVault may audit data handling practices
```

**TODO (Manual):** Legal team to draft actual agreement.

---

#### Step 4: Technical Integration

```
Verifier integrates OID4VP:

1. Create verification request:
   POST /verifier/presentations/request
   {
     verifierDid: "did:web:homefirst.com",
     credentialTypes: ["VerifiableIncomeCredential"],
     requiredClaims: { income: ["annualIncome", "currency"] },
     policies: ["require-trusted-issuer", "require-active-status"]
   }

2. Generate QR code / deep link for user's wallet

3. Receive VP Token at callback URL

4. Parse verification result:
   {
     verified: true,
     checks: { signature: true, status: true, trust: true, policy: true },
     credentials: [{ type: "VerifiableIncomeCredential", claims: { annualIncome: 95000 } }]
   }

Integration Checklist:
  - [ ] OID4VP request includes only approved claim types
  - [ ] Presentation definition matches registered claims
  - [ ] Callback URL is HTTPS
  - [ ] Verification result is handled correctly
  - [ ] Error handling for denied/expired/revoked credentials
```

**TODO (Manual):** Provide verifier with integration SDK and documentation.

---

#### Step 5: Go-Live

```
Verifier added to registry:

Verifier Registry Entry:
{
  "did": "did:web:homefirst.com",
  "name": "HomeFirst Finance",
  "approvedCredentialRequests": [
    { "type": "VerifiableIncomeCredential", "claims": ["annualIncome", "currency"] },
    { "type": "VerifiableEducationCredential", "claims": ["degree", "institution"] }
  ],
  "purposeStatements": { ... },
  "approvedAt": "2026-04-20",
  "agreementRef": "RPA-2026-0015"
}

Wallet displays to user:
┌────────────────────────────────────────────┐
│  HomeFirst Finance is requesting:          │
│                                            │
│  From your Income Credential (TrustBank):  │
│    ✓ Annual Income                         │
│    ✓ Currency                              │
│                                            │
│  Purpose: Loan eligibility assessment      │
│                                            │
│  [Allow]              [Deny]               │
└────────────────────────────────────────────┘
```

---

## 5. Onboarding Timeline

| Phase | Issuer | Verifier |
|---|---|---|
| Application | 1 day | 1 day |
| Verification | 1-2 weeks | 3-5 days |
| Legal agreement | 1-2 weeks | 1 week |
| DID setup | 1-3 days | 1 day |
| Schema agreement | 1 week | N/A |
| Technical integration | 2-4 weeks | 1-2 weeks |
| Testing (sandbox) | 1-2 weeks | 1 week |
| Certification | 1-2 weeks | 3-5 days |
| **Total** | **6-10 weeks** | **3-5 weeks** |

---

## 6. Real-World References

| System | How They Onboard | Governance |
|---|---|---|
| **EU eIDAS 2.0** | Government certifies issuers. Added to national Trusted List. Published at EU level (LOTL). | Government-run per Member State |
| **India DigiLocker** | Issuers sign MoU with MeitY. Technical integration via DigiLocker API. ~500+ issuers onboarded. | Government-run (MeitY) |
| **ONDC (India)** | Register on ONDC portal. Business verification. Sign participation agreement. Technical onboarding via Beckn protocol. | Open network, foundation-governed |
| **Verifiable Credentials (Microsoft Entra)** | Any Azure AD tenant becomes an issuer. Verifiers decide which issuers to trust (no central registry). | Decentralized (verifier decides) |
| **EBSI (EU)** | Trusted Accreditation Organizations approve issuers. Registered on-chain via smart contract. | Hierarchical (EU → TAO → Issuer) |
| **Australia Digital Identity** | Government accredits identity providers. Annual audit. Published in Trusted Digital Identity Framework. | Government-run (DTA) |

---

## 7. Prototype vs Production Comparison

| Aspect | Prototype (Now) | Production |
|---|---|---|
| **Onboarding** | Seed script pre-loads issuers | Full process (application → verification → agreement → go-live) |
| **Trust decision** | Hardcoded in seed data | Governance body reviews and approves |
| **DID method** | did:key (auto-generated) | did:web (issuer's own domain) |
| **Key management** | Software keys | HSM (FIPS 140-2 Level 2+) |
| **Legal** | None | Trust Framework Agreement + Relying Party Agreement |
| **Verification** | None (fictional issuers) | Domain check + business registration + sector license |
| **Testing** | Manual Postman | Conformance test suite + interop testing |
| **Monitoring** | Console logs | Uptime monitoring + compliance audits |
| **Timeline** | Instant (seed script) | 6-10 weeks (issuer), 3-5 weeks (verifier) |

---

## 8. Templates & TODOs

### Documents to Create (Post-Prototype)

- [ ] **Trust Framework Agreement** — legal template for issuers
- [ ] **Relying Party Agreement** — legal template for verifiers
- [ ] **Issuer Onboarding Guide** — step-by-step technical guide
- [ ] **Verifier Integration Guide** — OID4VP integration guide
- [ ] **Credential Schema Registry** — published schemas with versioning
- [ ] **Security Questionnaire** — for issuer verification
- [ ] **Conformance Test Suite** — automated interop tests
- [ ] **Incident Response Playbook** — for key compromise, data breach
- [ ] **Governance Framework** — who decides, how disputes are resolved

### APIs to Build (Post-Prototype)

- [ ] `POST /onboarding/issuers/apply` — issuer application submission
- [ ] `GET /onboarding/issuers/:id/status` — application status tracking
- [ ] `POST /onboarding/issuers/:id/verify-domain` — DNS verification trigger
- [ ] `POST /onboarding/issuers/:id/approve` — admin approval
- [ ] `POST /onboarding/verifiers/apply` — verifier registration
- [ ] `POST /onboarding/verifiers/:id/approve` — admin approval
- [ ] `GET /registry/issuers` — public trusted issuer list
- [ ] `GET /registry/verifiers` — public verifier registry

---

*Document Version: 1.0 | Created: 2026-03-30 | Scope: Production Onboarding Process*
