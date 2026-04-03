# TrustiLock End-to-End Testing Guide

This guide walks you through testing the entire TrustiLock system — backend API, web dashboards, and mobile wallet — working together.

---

## Prerequisites

1. **Backend API** running on `http://localhost:8000`
2. **Web Dashboard** running on `http://localhost:3000`
3. **Mobile App** running via Expo Go on your phone (same WiFi network)
4. **Database** seeded with default data

### Start Everything

```bash
# Terminal 1: Start all services
pnpm dev

# If you need to seed the database (first time only):
cd apps/api && pnpm exec tsx ../../infrastructure/seed/seed-data.ts
```

---

## Login Credentials

### Web Dashboard

| Role | Email | Password | URL |
|------|-------|----------|-----|
| Admin | `admin@trustilock.dev` | `Admin@123456` | http://localhost:3000/login → redirects to /admin |
| Issuer | `issuer@trustilock.dev` | `Issuer@123456` | http://localhost:3000/login → redirects to /issuer |
| Verifier | `verifier@trustilock.dev` | `Verifier@123456` | http://localhost:3000/login → redirects to /verifier |

### Mobile App (Wallet)

| Role | Email | Password |
|------|-------|----------|
| Holder | `holder@trustilock.dev` | `Holder@123456` |

You can also register a new holder account directly from the mobile app.

### API Direct (Swagger / Postman / curl)

All the above credentials work with `POST /auth/login`. Get the access token from the response and use it as `Authorization: Bearer <token>`.

Swagger UI: http://localhost:8000/api/docs

---

## End-to-End Test Flow

### Scenario: Sandhya Applies for a Home Loan

This tests the complete lifecycle: issue credentials → store in wallet → verify for loan.

---

### Phase 1: Admin Sets Up Trust Registry

**Who:** Admin (web dashboard)
**Login:** `admin@trustilock.dev` / `Admin@123456`

1. Open http://localhost:3000/login
2. Log in with admin credentials → lands on /admin
3. Go to **Trust Registry** → **Issuers**
4. Click **Register Issuer** and add:
   - Name: `National Technical University`
   - DID: (copy from the issuer's DID — or use any `did:key:z...` string for testing)
   - Credential Types: `VerifiableEducationCredential`
5. Register another issuer:
   - Name: `TrustBank India`
   - DID: (different DID)
   - Credential Types: `VerifiableIncomeCredential`
6. Verify both appear in the issuers list with status "active"

**What to check:**
- Both issuers show in the list
- Trust verification passes: `GET /trust/verify?issuerDid=<did>&credentialType=VerifiableEducationCredential` returns `{ trusted: true }`

---

### Phase 2: Issuer Creates Credential Offers

**Who:** Issuer (web dashboard)
**Login:** `issuer@trustilock.dev` / `Issuer@123456`

1. Log in → lands on /issuer
2. Go to **Schemas** — verify 3 schemas are listed (Education, Income, Identity)
3. Go to **Create Offer** (or /issuer/offers/new)
4. Create Education Credential:
   - Schema: `VerifiableEducationCredential`
   - Subject DID: (the holder's DID — or `did:key:zHolder1` for testing)
   - Claims:
     ```json
     {
       "institutionName": "National Technical University",
       "degree": "Bachelor of Technology",
       "fieldOfStudy": "Computer Science",
       "graduationDate": "2023-06-15",
       "gpa": 3.8,
       "studentId": "NTU-2019-CS-042"
     }
     ```
5. Copy the **Credential Offer URI** or **QR code** shown
6. Create Income Credential:
   - Schema: `VerifiableIncomeCredential`
   - Claims:
     ```json
     {
       "employerName": "TrustBank India",
       "jobTitle": "Software Engineer",
       "annualIncome": 1200000,
       "currency": "INR",
       "employmentStartDate": "2023-08-01",
       "employeeId": "TBI-EMP-1042"
     }
     ```
7. Copy this offer URI too

**What to check:**
- Offers created successfully with pre-authorized codes
- QR codes display correctly
- Offers appear in the issuer's credentials list

---

### Phase 3: Holder Receives Credentials (Mobile App)

**Who:** Holder (mobile app)
**Login:** `holder@trustilock.dev` / `Holder@123456`

1. Open the TrustiLock mobile app on your phone
2. Log in (or register a new account)
3. Tap **Receive Credential** (or scan QR code icon)
4. Scan the Education Credential QR code from the issuer dashboard
   - OR paste the credential offer URI
5. Review the credential details shown on screen
6. Tap **Accept** to store it
7. Repeat for the Income Credential
8. Go to the **Home/Wallet** screen — you should see two credential cards:
   - Blue: Education Credential from National Technical University
   - Green: Income Credential from TrustBank India
9. Tap each card to see full details

**What to check:**
- Both credentials stored in the wallet
- Credential details match what the issuer entered
- Selective disclosure claims are marked (GPA, Student ID, etc.)

---

### Phase 4: Verifier Requests Verification

**Who:** Verifier (web dashboard)
**Login:** `verifier@trustilock.dev` / `Verifier@123456`

1. Log in → lands on /verifier
2. Go to **Create Request** (or /verifier/requests/new)
3. Create a verification request:
   - Credential Types: `VerifiableEducationCredential`, `VerifiableIncomeCredential`
   - Policies: `require-trusted-issuer`, `require-active-status`, `require-non-expired`
4. A QR code or link is generated
5. Display it on screen for the holder to scan

**What to check:**
- Request created with unique nonce and state
- QR code displays the authorization request URI

---

### Phase 5: Holder Shares Credentials (Mobile App)

**Who:** Holder (mobile app)

1. Scan the verifier's QR code
2. The app shows what the verifier is requesting:
   - Education: institution, degree (required) + GPA, student ID (optional)
   - Income: employer, annual income, currency (required) + job title, employee ID (optional)
3. **Uncheck** GPA, Student ID, and Employee ID (selective disclosure)
4. Keep Job Title checked
5. Tap **Share**
6. The app shows "Presentation submitted successfully"

**What to check:**
- Consent screen shows correct required/optional fields
- Only selected fields are included in the presentation
- Consent record saved in wallet history

---

### Phase 6: Verifier Sees Results

**Who:** Verifier (web dashboard)

1. Go to **Results** page
2. Find the verification request — status should be "verified" or "rejected"
3. Click to see details:

**Expected result for valid credentials:**
```
Education Credential:
  [PASS] Trusted Issuer
  [PASS] Valid Signature
  [PASS] Not Expired
  [PASS] Not Revoked

Income Credential:
  [PASS] Trusted Issuer
  [PASS] Valid Signature
  [PASS] Not Expired
  [PASS] Not Revoked

OVERALL: VERIFIED
```

4. Verify that only the disclosed fields are visible (no GPA, no Student ID, no Employee ID)

**What to check:**
- All 4 checks pass for both credentials
- Disclosed claims match what the holder selected
- Hidden claims are NOT visible

---

### Phase 7: Test Revocation

**Who:** Issuer (web dashboard) → then Verifier

1. Log in as issuer (`issuer@trustilock.dev`)
2. Go to **Credentials** list
3. Find the education credential and click **Revoke**
4. Now switch to verifier (`verifier@trustilock.dev`)
5. Create a new verification request for the same credential types
6. Have the holder present again

**Expected result:**
```
Education Credential:
  [PASS] Trusted Issuer
  [PASS] Valid Signature
  [PASS] Not Expired
  [FAIL] Not Revoked — Credential has been revoked

OVERALL: NOT VERIFIED
```

**What to check:**
- Revocation takes effect immediately
- Verification correctly fails on the status check
- The revoked credential still exists in the wallet but cannot pass verification

---

### Phase 8: Test Untrusted Issuer Rejection

**Who:** Admin + Verifier

1. Log in as admin (`admin@trustilock.dev`)
2. Go to Trust Registry → **Remove** one of the issuers (e.g., National Technical University)
3. Now try verifying the education credential again

**Expected result:**
```
Education Credential:
  [FAIL] Trusted Issuer — Issuer not found in trust registry

OVERALL: NOT VERIFIED
```

**What to check:**
- Trust registry changes are immediate
- Previously trusted credentials fail once issuer is removed

---

## Quick API-Only Test (No Frontend Needed)

If you want to test the backend without the web/mobile apps, use curl:

```bash
# 1. Login as issuer
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"issuer@trustilock.dev","password":"Issuer@123456"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).data.access_token")

# 2. Create offer
curl -s -X POST http://localhost:8000/issuer/offers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "schemaTypeUri": "VerifiableEducationCredential",
    "subjectDid": "did:key:zHolder1",
    "claims": {"institutionName":"NTU","degree":"BTech","fieldOfStudy":"CS","graduationDate":"2023-06-15"}
  }'

# 3. Exchange token (public - no auth needed)
PRE_AUTH_CODE="<paste from step 2>"
curl -s -X POST http://localhost:8000/issuer/token \
  -H "Content-Type: application/json" \
  -d "{\"grant_type\":\"urn:ietf:params:oauth:grant-type:pre-authorized_code\",\"pre-authorized_code\":\"$PRE_AUTH_CODE\"}"

# 4. Get credential (public - uses OID4VCI access token, not JWT)
OID4VCI_TOKEN="<paste access_token from step 3>"
curl -s -X POST http://localhost:8000/issuer/credential \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OID4VCI_TOKEN" \
  -d '{"format":"vc+sd-jwt","credential_definition":{"type":["VerifiableEducationCredential"]}}'

# 5. Login as admin, register trusted issuer
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trustilock.dev","password":"Admin@123456"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).data.access_token")

curl -s -X POST http://localhost:8000/trust/issuers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"did":"<issuer DID from metadata>","name":"NTU","credentialTypes":["VerifiableEducationCredential"]}'

# 6. Login as verifier, create verification request
VERIFIER_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"verifier@trustilock.dev","password":"Verifier@123456"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0,'utf8')).data.access_token")

curl -s -X POST http://localhost:8000/verifier/presentations/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $VERIFIER_TOKEN" \
  -d '{"verifierDid":"did:key:zVerifier1","credentialTypes":["VerifiableEducationCredential"]}'
```

---

## Automated Tests

```bash
# Run all 110 unit tests
pnpm test

# Tests cover:
# - Auth: register, login, refresh, guards, RBAC, API keys (23 tests)
# - JWT Guard: public routes, token validation (8 tests)
# - Roles Guard: role matching, edge cases (9 tests)
# - Wallet: DID, credentials, presentations, consent (16 tests)
# - Policy Engine: trust/status/expiry policies (15 tests)
# - Bitstring Status List: encode/decode, revocation (13 tests)
# - DID, Crypto, SD-JWT: key gen, signing, issuance (15 tests)
# - Issuer, Verification, Trust, Loan E2E (11 tests)
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Invalid email or password" on dashboard | Make sure there is no trailing space/tab. Clear the field and retype. Backend trims automatically. |
| 401 on protected endpoints | Token expired (15 min). Login again or call `/auth/refresh`. |
| 403 Forbidden | Wrong role. Check which role the endpoint requires (see docs/DEFAULT_CREDENTIALS.md). |
| "Database is not connected" | Check `apps/api/.env` has correct `DATABASE_URL`. Run `pnpm dev:api` from `apps/api/` directory. |
| Mobile app cannot reach API | Use your LAN IP instead of localhost. Set `EXPO_PUBLIC_API_URL=http://192.168.x.x:8000` in root `.env`. |
| Prisma type errors | Run `npx prisma generate --schema=apps/api/prisma/schema.prisma`. Kill dev server first on Windows. |
| CORS errors in browser | Backend CORS is set to `*`. Check if Helmet headers are blocking — should be fixed with `crossOriginResourcePolicy: 'cross-origin'`. |
