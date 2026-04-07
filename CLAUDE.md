# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

TrustiLock is a Verifiable Credential ecosystem prototype — issuer, wallet, verifier, trust registry. Zero budget, milestone-based execution.

- **Backend:** Modular NestJS monolith with Mongoose + MongoDB Atlas
- **Mobile Wallet:** React Native + Expo (phone app — QR scanning, credential storage)
- **Web Portals:** Next.js + shadcn/ui (Issuer, Verifier, Trust Admin dashboards)

**Key docs:** `docs/planning/TRUSTILOCK_ROADMAP.md`, `docs/planning/TRUSTILOCK_EXECUTION_PLAN.md`, `docs/planning/TRUSTILOCK_FRONTEND_PLAN.md`

## Common Commands

```bash
# Install dependencies
pnpm install

# Start development (requires DATABASE_URL set in .env pointing to MongoDB Atlas)
pnpm dev

# No schema generation step needed — Mongoose schemas are defined in code

# Run tests
pnpm test              # Unit tests
pnpm test:e2e          # E2E scenarios

# Build
pnpm build

# Lint
pnpm lint

# Start everything (Docker — API only, MongoDB is cloud)
docker compose -f infrastructure/docker-compose.yml up --build
```

## Architecture

### Monorepo Structure

- **`/apps/api`** — Single NestJS application (modular monolith)
  - `modules/did/` — DID creation and resolution (did:key, did:web)
  - `modules/crypto/` — SD-JWT signing/verification, JWT ops, key management
  - `modules/issuer/` — OID4VCI endpoints (credential issuance)
  - `modules/wallet/` — Credential storage, OID4VCI client, OID4VP client, consent
  - `modules/verifier/` — OID4VP endpoints, validation pipeline, policy engine
  - `modules/trust/` — Trust registry (trusted issuers, credential type mapping)
  - `modules/status/` — Bitstring Status List (revocation/suspension)
  - `common/` — Shared types, constants, decorators, filters
- **`/packages/shared`** — Shared types and utilities
- **`/infrastructure`** — Docker Compose, seed scripts

### Tech Stack

- **Language:** TypeScript (Node.js 20 LTS)
- **Framework:** NestJS 10+
- **Database:** MongoDB Atlas (cloud, free tier) via Mongoose
- **VC Libraries:** Veramo 6.x, Sphereon OID4VCI/OID4VP, panva/jose, sd-jwt-js
- **DID Methods:** did:key (prototype), did:web (production)
- **Credential Format:** SD-JWT-VC (primary), JWT-VC (fallback)
- **Testing:** Vitest + Supertest
- **Monorepo:** Turborepo

### Key Protocols

- **OID4VCI** — OpenID for Verifiable Credential Issuance (issuer endpoints)
- **OID4VP** — OpenID for Verifiable Presentations (verifier endpoints)
- **SD-JWT-VC** — Selective Disclosure JWT Verifiable Credentials
- **Bitstring Status List** — W3C credential revocation mechanism

---

## Core Rules

These rules override defaults. Apply to every response, every file, every change.

### Discipline

- **No workarounds.** If something cannot be done cleanly, stop and propose the clean alternative.
- **No guessing.** If the requirement, pattern, data shape or API contract is unclear, ask before implementing.
- **No premature abstraction.** Three similar lines of code is better than a premature helper. Build what is needed now.
- **No scope creep.** Implement only what the current milestone requires. Do not add features from future milestones.

### Package Manager

- **pnpm only.** Never use npm or yarn. This is enforced by a hook — commands using npm/yarn will be blocked.
- Use `pnpm add`, `pnpm remove`, `pnpm install`, `pnpm run`, `pnpm dev`, `pnpm build`, `pnpm test`.
- Workspace dependencies use `workspace:^` protocol.

### Code Standards

- **Follow existing patterns.** Find the closest reference implementation in the codebase and match it.
- **NestJS conventions.** Use modules, services, controllers, DTOs. No logic in controllers — delegate to services.
- **Mongoose for all DB access.** No raw MongoDB driver queries. Use Mongoose models exclusively.
- **Validate all inputs.** Use class-validator decorators on every DTO. No unvalidated request data.
- **Type everything.** No `any`. No implicit types. Use strict TypeScript.
- **Consistent naming.** Files: kebab-case. Classes: PascalCase. Functions/variables: camelCase. Database collections: snake_case.
- **One module per concern.** DID logic stays in DID module. Crypto stays in crypto module. No cross-cutting shortcuts.

### API Standards

- **RESTful conventions.** GET for reads, POST for creates/actions, PUT for updates, DELETE for removes.
- **Swagger decorators on every endpoint.** Use `@ApiTags`, `@ApiOperation`, `@ApiResponse` from `@nestjs/swagger`.
- **Consistent response shapes.** Success: `{ data, message? }`. Error: `{ error, statusCode, message }`.
- **Verify against the API contracts** in `docs/planning/TRUSTILOCK_EXECUTION_PLAN.md` Section 3 before implementing any endpoint.

### VC/Crypto Standards

- **ES256 (P-256) only** for signing. No Ed25519 in this prototype (HAIP compliance).
- **SD-JWT-VC is the primary format.** JWT-VC is fallback only.
- **Never log private keys or raw credentials.** Log credential IDs, DIDs, types — never claim values or key material.
- **Never store private keys in plaintext.** Even in prototype, use Veramo's key manager abstraction.
- **Validate all signatures before trusting data.** Never skip signature verification.

### Testing

- **Every milestone must have passing tests** before moving to the next.
- **E2E tests map to the 5 mandatory scenarios** from the problem statement.
- **Test the unhappy paths.** Untrusted issuer rejection, revoked credential rejection, expired credential rejection.

### Git

- **Never add AI author attribution** in commits. No `Co-Authored-By`. No `--author` flag. All commits are from Sandhya Sharma only.
- **Conventional commits:** lowercase type, imperative mood. Examples: `feat: add OID4VCI token endpoint`, `fix: correct SD-JWT disclosure hashing`.
- **Commit and push after every milestone.** When a milestone is complete, stage all changes, commit with the milestone message from the execution plan, and push to `origin main`.
- **Commit logically grouped changes.** Do not bundle unrelated work.
- **Do not commit `.env` files, private keys or credential data.**

### Writing

- Use unambiguous language. Be crisp, clear, concise.
- Prefer clarity over complexity.
- Do not use contractions.

### Efficiency

- **Do not over-explore.** If context is already available, use it.
- **Do not launch agents for work you can do directly.**
- **One milestone at a time.** Do not implement multiple milestones in parallel.
- **When blocked, ask.** Do not burn tokens exploring when a question to the user resolves it faster.
- **Read the execution plan first.** Before implementing any module, read the relevant section in `docs/planning/TRUSTILOCK_EXECUTION_PLAN.md`.

---

## Milestone Reference

### Backend (see `docs/planning/TRUSTILOCK_EXECUTION_PLAN.md`)
```
M1: Foundation     → Monorepo, Mongoose+MongoDB, DID module, Crypto module
M2: Issuer         → OID4VCI endpoints, SD-JWT-VC issuance
M3: Wallet+Status  → Credential storage, OID4VCI client, Bitstring Status List
M4: Verifier+Trust → OID4VP endpoints, validation pipeline, trust registry
M5: E2E            → Wire all modules, 5 test scenarios, seed data
M6: Demo Ready     → Swagger, Postman, Docker Compose, README
```

### Frontend (see `docs/planning/TRUSTILOCK_FRONTEND_PLAN.md`)
```
FM1: Foundation    → Expo + Next.js setup, design system, shared types
FM2: Mobile Wallet → Dashboard, receive, present, consent, QR scanning
FM3: Web Portals   → Issuer, Verifier, Trust Admin dashboards and flows
FM4: E2E Flows     → Cross-platform: web QR → phone scan → web result
FM5: Polish        → Accessibility, animations, responsive, compliance
```