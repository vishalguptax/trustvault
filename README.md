# TrustiLock

Verifiable Credential ecosystem prototype — issuer, wallet, verifier, and trust registry. Built as a Turborepo monorepo with a modular NestJS backend, Next.js web dashboards, and an Expo React Native mobile wallet.

## Architecture

```
trustilock/
├── apps/
│   ├── api/            NestJS modular monolith        (port 8000)
│   ├── web/            Next.js issuer/verifier/admin  (port 3000)
│   └── mobile/         Expo React Native wallet       (port 5000)
├── packages/
│   └── shared/         Shared types, constants, utils
├── infrastructure/     Docker Compose, seed scripts
├── scripts/            WSL setup for local builds
└── tools/              Dev CLI (Windows Terminal)
```

All documentation lives in [`docs/`](docs/README.md):

- [API](docs/apps/API.md) — Backend setup, modules, env vars, Docker
- [Web](docs/apps/WEB.md) — Dashboards, portals, API client
- [Mobile](docs/apps/MOBILE.md) — Wallet, EAS builds, API URL config
- [Onboarding](docs/setup/TRUSTILOCK_ONBOARDING.md) — First-time setup
- [E2E Testing](docs/guides/E2E_TESTING_GUIDE.md) — Full system testing
- [Architecture](docs/guides/TECHNICAL_ARCHITECTURE.md) — System design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 11, Prisma 6, MongoDB Atlas |
| Web | Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, Zustand |
| Mobile | Expo 55, React Native 0.83, Expo Router, Expo Secure Store |
| Credentials | SD-JWT-VC, OID4VCI, OID4VP, Bitstring Status List |
| Crypto | ES256 (P-256), jose, sd-jwt-js |
| DID | did:key (prototype), did:web (production) |
| Monorepo | Turborepo, pnpm workspaces |

## Prerequisites

- **Node.js** >= 20
- **pnpm** >= 10 (`npm install -g pnpm`)
- **MongoDB Atlas** account (free tier)
- **Expo Go** app on your phone (for mobile development)

## Quick Start

```bash
# 1. Clone and install (Prisma client auto-generates via postinstall)
git clone <repo-url> && cd trustilock
pnpm install

# 2. Copy environment files
cp apps/api/.env.example apps/api/.env        # Set DATABASE_URL, JWT_SECRET
cp apps/mobile/.env.example apps/mobile/.env  # Set LAN IP

# 3. Push schema to database
pnpm --filter @trustilock/api prisma:push

# 4. Start everything
pnpm dev
```

Or use the one-command setup (installs + generates Prisma):

```bash
pnpm setup
```

## Monorepo Scripts

All commands run from the repo root. pnpm is the only supported package manager.

| Command | Description |
|---------|-------------|
| `pnpm install` | Install dependencies for all workspaces |
| `pnpm dev` | Start API + Web + Mobile concurrently |
| `pnpm dev:api` | Start API only (port 8000) |
| `pnpm dev:web` | Start Web only (port 3000) |
| `pnpm dev:mobile` | Start Mobile only (port 5000) |
| `pnpm build` | Build all packages |
| `pnpm test` | Run API unit tests |
| `pnpm test:e2e` | Run API end-to-end tests |
| `pnpm lint` | Lint all packages |
| `pnpm clean` | Clean build outputs |
| `pnpm start` | Dev CLI — opens each service in a Windows Terminal tab |

### Mobile Build Shortcuts

| Command | Description |
|---------|-------------|
| `pnpm build:mobile:dev` | Development build (debug APK) |
| `pnpm build:mobile:preview` | Preview APK (internal testing) |
| `pnpm build:mobile:prod` | Production app bundle |

## Environment Variables

Each app manages its own `.env` file. There is no shared root `.env` for app config.

| App | Env File | Key Variables |
|-----|----------|---------------|
| API | `apps/api/.env` | `DATABASE_URL`, `JWT_SECRET`, `API_BASE_URL`, `RESEND_API_KEY` |
| Web | System env or `.env.local` | `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`) |
| Mobile | `apps/mobile/.env` | `EXPO_PUBLIC_API_URL` (use LAN IP for phone) |

See each app's doc for the full variable reference: [API](docs/apps/API.md), [Web](docs/apps/WEB.md), [Mobile](docs/apps/MOBILE.md).

### Changing the Backend URL

The API URL is configured per-app, each reading its own environment variable:

| App | Variable | Where to set |
|-----|----------|-------------|
| Web | `NEXT_PUBLIC_API_URL` | System env, `.env.local`, or hosting dashboard |
| Mobile (dev) | `EXPO_PUBLIC_API_URL` | `apps/mobile/.env` |
| Mobile (prod) | `EXPO_PUBLIC_API_URL` | `apps/mobile/eas.json` → production.env |
| API (self-reference) | `API_BASE_URL` | `apps/api/.env` |

## Adding Dependencies

Always scope dependencies to the workspace that uses them:

```bash
# Add to a specific app
pnpm --filter @trustilock/api add <package>
pnpm --filter @trustilock/web add <package>
pnpm --filter @trustilock/mobile add <package>

# Add to shared package
pnpm --filter @trustilock/shared add <package>

# Add a root dev dependency (monorepo tooling only)
pnpm add -Dw <package>
```

Never add app-specific dependencies to the root `package.json`.

## Docker

### Development

```bash
docker compose -f infrastructure/docker-compose.yml up --build
```

Runs the API with hot-reload on port 8000. Database is MongoDB Atlas (not containerized).

### Production

The API has a multi-stage Dockerfile (`apps/api/Dockerfile`) using Node 20 Alpine. Render.com deployment is configured in `render.yaml`.

## Project Structure

```
apps/api/
├── src/
│   ├── modules/        Domain modules (auth, did, crypto, issuer, verifier, etc.)
│   ├── config/         Centralized configuration
│   ├── common/         Shared filters, interceptors, decorators
│   ├── prisma/         Prisma service
│   └── main.ts         Bootstrap
├── prisma/
│   └── schema.prisma   Database schema
└── test/               Unit and E2E tests

apps/web/
├── src/
│   ├── app/            Next.js App Router pages
│   ├── components/     UI components (shadcn/ui)
│   ├── lib/            API client, auth store, constants
│   └── styles/         Global CSS

apps/mobile/
├── app/
│   ├── (auth)/         Login, register, MPIN, lock screens
│   └── (tabs)/         Home, scanner, credentials, history, profile
├── components/         React Native components
├── lib/                API client, auth, routes, constants
└── hooks/              Custom React hooks

packages/shared/
└── src/                Shared types, constants, utilities
```

## License

Private — all rights reserved.
