# TrustVault Default Credentials

## API Login Credentials

Use these to log in via `POST /auth/login` with `{ "email": "...", "password": "..." }`.

| Email | Password | Role | Access |
|-------|----------|------|--------|
| `admin@trustvault.dev` | `Admin@123456` | admin | Full access — trust registry, policies, all endpoints |
| `issuer@trustvault.dev` | `Issuer@123456` | issuer | Create offers, issue credentials, revoke/suspend |
| `verifier@trustvault.dev` | `Verifier@123456` | verifier | Create verification requests, view results |
| `holder@trustvault.dev` | `Holder@123456` | holder | Wallet — receive, store, present credentials |

## How to Use

### 1. Login (get tokens)
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@trustvault.dev", "password": "Admin@123456"}'
```

Response:
```json
{
  "data": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "user": { "id": "...", "email": "admin@trustvault.dev", "role": "admin" }
  }
}
```

### 2. Use the token
```bash
curl http://localhost:8000/issuer/credentials \
  -H "Authorization: Bearer eyJ..."
```

### 3. Refresh when expired (access token = 15 min)
```bash
curl -X POST http://localhost:8000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

## Role Permissions

### Admin (`admin@trustvault.dev`)
- Trust Registry: register/update/delete issuers
- Policies: create verifier policies
- Credentials: view all issued credentials
- Status: revoke/suspend/reinstate credentials
- API Keys: generate API keys
- All other endpoints

### Issuer (`issuer@trustvault.dev`)
- Create credential offers
- View issued credentials
- Revoke/suspend/reinstate credentials

### Verifier (`verifier@trustvault.dev`)
- Create verification/presentation requests
- View verification results

### Holder (`holder@trustvault.dev`)
- Wallet: receive, store, view, delete credentials
- Create presentations (share credentials)
- View consent history

## Public Endpoints (No Login Required)
- `GET /issuer/.well-known/openid-credential-issuer` — Issuer metadata
- `GET /issuer/schemas` — List credential schemas
- `GET /issuer/schemas/:id` — Schema details
- `POST /issuer/token` — OID4VCI token exchange
- `POST /issuer/credential` — OID4VCI credential endpoint
- `GET /trust/issuers` — List trusted issuers
- `GET /trust/issuers/:did` — Issuer details
- `GET /trust/verify` — Trust verification check
- `GET /trust/schemas` — List schemas
- `GET /status/lists/:id` — Status list (W3C format)
- `GET /verifier/policies` — List policies
- `POST /verifier/presentations/response` — Submit VP response (from wallet)
- `POST /auth/register` — Register new user
- `POST /auth/login` — Login
- `POST /auth/refresh` — Refresh token
- `GET /api/docs` — Swagger UI

## Seeding

Run this to create the default users:
```bash
cd apps/api
pnpm exec tsx ../../infrastructure/seed/seed-data.ts
```
