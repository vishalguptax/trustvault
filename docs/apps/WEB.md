# @trustilock/web

Next.js 15 web dashboards for issuer, verifier, and trust admin roles.

## Setup

```bash
# From repo root
pnpm install

# Start dev server (port 3000)
pnpm dev:web
```

The web app connects to the API at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`). Make sure the API is running.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server on port 3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build on port 3000 |
| `pnpm lint` | Run Next.js linter |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL |

Set via system environment, `.env.local`, or your hosting platform's dashboard. This value is baked into the build at compile time.

## Portals

### Issuer Portal (`/issuer`)

- **Schemas** — View and manage credential schemas (education, income, identity)
- **Credentials** — Browse issued credentials, view status
- **Offers** — Create credential offers (single or bulk), generate QR codes
- **New Offer** — Step-by-step credential offer creation with claim fields

### Verifier Portal (`/verifier`)

- **Requests** — Create verification requests, select credential types and claims
- **Policies** — Manage verification policies (trusted issuer, active status, non-expired)
- **Results** — View verification results with real-time SSE updates
- **QR Display** — Shareable QR codes for credential presentation

### Trust Admin (`/admin`)

- **Users** — User management and role assignment
- **Issuers** — Onboard and manage trusted issuers
- **Schemas** — Configure credential schemas and claim definitions
- **Policies** — System-wide verification policies

### Public Pages

- **Landing** (`/`) — Portal overview and login
- **Login** (`/login`) — Authentication with role-based redirect
- **Verify** (`/verify/[id]`) — Public shareable verification page

## Tech Stack

- **Next.js 15** with App Router
- **React 19**
- **Tailwind CSS 4** with shadcn/ui components (Radix UI primitives)
- **Zustand** for auth state management
- **React Hook Form + Zod** for form validation
- **Recharts** for data visualization
- **Motion** (Framer Motion) for animations
- **Sonner** for toast notifications
- **Phosphor Icons + Lucide React** for icons

## API Client

All API calls go through a single client at `src/lib/api/client.ts`. The base URL comes from `src/lib/constants.ts` — one place to change.

The auth store (`src/lib/auth/auth-store.ts`) handles JWT tokens, auto-refresh on 401, and role-based redirects.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          Root layout
│   ├── page.tsx            Landing page
│   ├── login/              Login page
│   ├── issuer/             Issuer portal pages
│   │   ├── page.tsx        Dashboard
│   │   ├── schemas/        Schema management
│   │   ├── credentials/    Credential browser
│   │   └── offers/         Offer creation and management
│   ├── verifier/           Verifier portal pages
│   │   ├── page.tsx        Dashboard
│   │   ├── requests/       Verification request creation
│   │   ├── policies/       Policy management
│   │   └── results/        Verification results
│   ├── admin/              Trust admin pages
│   │   ├── page.tsx        Dashboard
│   │   ├── users/          User management
│   │   ├── issuers/        Trusted issuer onboarding
│   │   └── schemas/        Schema configuration
│   └── verify/[id]/        Public verification page
├── components/
│   ├── ui/                 shadcn/ui base components
│   ├── qr/                 QR code display components
│   └── ...                 Feature-specific components
├── lib/
│   ├── constants.ts        API_BASE_URL (single source)
│   ├── api/client.ts       Fetch wrapper with auth
│   ├── auth/auth-store.ts  Zustand auth state
│   ├── credential-styles.ts
│   └── utils.ts            Tailwind merge utility
└── styles/
    └── globals.css         Tailwind and theme variables
```
