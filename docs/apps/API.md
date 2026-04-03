# @trustilock/api

NestJS modular monolith — the backend for the TrustiLock Verifiable Credential ecosystem.

## Setup

```bash
# From repo root
pnpm install

# Copy env and set DATABASE_URL
cp .env.example .env

# Generate Prisma client and push schema
pnpm prisma:generate
pnpm prisma:push

# Start dev server (port 8000, hot-reload)
pnpm dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start with hot-reload (NestJS watch mode) |
| `pnpm build` | Generate Prisma client + build NestJS |
| `pnpm start` | Run built output (`dist/main.js`) |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:e2e` | Run end-to-end tests |
| `pnpm lint` | Lint and auto-fix |
| `pnpm prisma:generate` | Regenerate Prisma client |
| `pnpm prisma:push` | Push schema changes to MongoDB |
| `pnpm clean` | Remove `dist/` |

## Environment Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | `8000` | No | Server port |
| `DATABASE_URL` | — | Yes | MongoDB Atlas connection string |
| `NODE_ENV` | `development` | No | Environment |
| `API_BASE_URL` | `http://localhost:8000` | No | Public URL of this API (used in credential URIs, Swagger) |
| `WEB_APP_URL` | `http://localhost:3000` | No | Web dashboard URL (used in shareable verification links) |
| `JWT_SECRET` | — | Yes | Secret for signing auth JWTs |
| `JWT_ACCESS_EXPIRY` | `15m` | No | Access token TTL |
| `JWT_REFRESH_EXPIRY` | `7d` | No | Refresh token TTL |
| `ISSUER_DID` | — | No | Pre-set issuer DID (generated on first run if empty) |
| `ISSUER_BASE_URL` | `{API_BASE_URL}/issuer` | No | OID4VCI issuer endpoint |
| `DEFAULT_DID_METHOD` | `key` | No | DID method (`key` or `web`) |
| `DEFAULT_CREDENTIAL_FORMAT` | `sd-jwt-vc` | No | Credential format |
| `DEFAULT_CREDENTIAL_EXPIRY_DAYS` | `365` | No | Default credential TTL |
| `STATUS_LIST_SIZE` | `131072` | No | Bitstring Status List size |
| `CORS_ORIGIN` | `*` | No | Allowed CORS origins |
| `RESEND_API_KEY` | — | No | Resend email service key |

## Modules

| Module | Path | Purpose |
|--------|------|---------|
| Auth | `modules/auth/` | JWT login, registration, role-based guards, token refresh |
| DID | `modules/did/` | Create and resolve DIDs (did:key, did:web) |
| Crypto | `modules/crypto/` | SD-JWT signing/verification, ES256 key management |
| Issuer | `modules/issuer/` | OID4VCI credential offers and issuance |
| Wallet | `modules/wallet/` | Credential storage, OID4VCI/OID4VP client |
| Verifier | `modules/verifier/` | OID4VP verification requests, validation pipeline |
| Trust | `modules/trust/` | Trust registry — trusted issuers, credential type mapping |
| Status | `modules/status/` | Bitstring Status List — revocation and suspension |
| Mail | `modules/mail/` | Transactional email via Resend |
| Health | `modules/health/` | Health check endpoint |

## API Documentation

Swagger UI is available at `/api/docs` when the server is running.

```
http://localhost:8000/api/docs
```

## Docker

```bash
# Build and run
docker build -f Dockerfile -t trustilock-api ../..
docker run -p 8000:8000 --env-file .env trustilock-api

# Or use docker compose from repo root
docker compose -f infrastructure/docker-compose.yml up --build
```

The Dockerfile is a multi-stage build using Node 20 Alpine. Production deployment to Render.com is configured in `render.yaml` at the repo root.

## Project Structure

```
src/
├── main.ts                 Bootstrap, Swagger, CORS, security
├── app.module.ts           Root module — imports all domain modules
├── config/
│   └── configuration.ts    Centralized env config (single source of truth)
├── common/
│   ├── filters/            Global exception filter
│   ├── interceptors/       Response wrapper interceptor
│   ├── decorators/         Custom decorators
│   └── guards/             Auth and role guards
├── prisma/
│   └── prisma.service.ts   Database connection
└── modules/
    ├── auth/               Login, register, JWT, roles
    ├── did/                DID creation and resolution
    ├── crypto/             SD-JWT, key management
    ├── issuer/             OID4VCI endpoints
    ├── wallet/             Credential storage
    ├── verifier/           OID4VP endpoints
    ├── trust/              Trust registry
    ├── status/             Revocation lists
    ├── mail/               Email service
    └── health/             Health check

prisma/
└── schema.prisma           MongoDB schema

test/
├── unit/                   Unit tests
└── e2e/                    End-to-end tests
```
