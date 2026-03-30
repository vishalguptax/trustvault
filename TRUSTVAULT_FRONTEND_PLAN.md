# TrustVault — Frontend & UI/UX Plan

## Milestone-Based | Next.js + shadcn/ui + Tailwind | Zero Budget

> **Scope:** All frontend surfaces — Wallet, Issuer Portal, Verifier Portal, Trust Admin.
> **Backend:** Consumed via REST APIs (see `TRUSTVAULT_EXECUTION_PLAN.md` Section 3).
> **Skills Used:** All 8 available skills mapped to specific milestones with exact prompts.

---

## 1. Frontend Surfaces

| Surface | Primary User | Purpose | Priority |
|---|---|---|---|
| **Wallet** | Individual holder | Receive, store, manage, present credentials | Highest |
| **Issuer Portal** | Organization (bank, university) | Create offers, issue credentials, manage schemas, revoke | High |
| **Verifier Portal** | Organization (loan company) | Create verification requests, view results, manage policies | High |
| **Trust Admin** | Platform admin | Manage trusted issuers, schemas, trust policies | Medium |
| **Landing Page** | Everyone | Role selection, platform overview | Medium |

**Architecture:** Single Next.js app with role-based routing (`/wallet/*`, `/issuer/*`, `/verifier/*`, `/admin/*`).

---

## 2. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | SSR, file-based routing, React Server Components |
| **Styling** | Tailwind CSS 3.4+ | Utility-first, design system via CSS variables |
| **Components** | shadcn/ui | Accessible, customizable, Radix primitives |
| **Icons** | Phosphor Icons (`@phosphor-icons/react`) | Consistent, flexible weight system |
| **Toasts** | Sonner | Minimal, beautiful toast notifications |
| **Animation** | Framer Motion | Page transitions, micro-interactions |
| **QR Code** | `qrcode.react` (display) + `html5-qrcode` (scan) | Generate and scan QR codes |
| **Forms** | React Hook Form + Zod | Type-safe validation, performance |
| **HTTP Client** | Native `fetch` | Zero dependency, works with Next.js |
| **Charts** | Recharts | Dashboard statistics |
| **State** | React Context + Zustand (if needed) | Simple prototype state management |
| **Package Manager** | pnpm | Consistent with backend |

---

## 3. Folder Structure

```
apps/web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (theme, fonts, providers)
│   │   ├── page.tsx                  # Landing page + role selector
│   │   │
│   │   ├── wallet/
│   │   │   ├── layout.tsx            # Wallet shell (sidebar, header)
│   │   │   ├── page.tsx              # Dashboard — credential cards grid
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx          # Credential detail (claims, status, issuer)
│   │   │   ├── receive/
│   │   │   │   └── page.tsx          # Receive credential (scan QR → preview → confirm)
│   │   │   ├── present/
│   │   │   │   └── page.tsx          # Present credential (request → select → disclose → consent → result)
│   │   │   └── history/
│   │   │       └── page.tsx          # Consent history
│   │   │
│   │   ├── issuer/
│   │   │   ├── layout.tsx            # Issuer shell
│   │   │   ├── page.tsx              # Dashboard — stats + recent issuances
│   │   │   ├── offers/
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # Create credential offer (schema → claims → QR)
│   │   │   ├── credentials/
│   │   │   │   └── page.tsx          # Issued credentials table + revoke
│   │   │   └── schemas/
│   │   │       └── page.tsx          # Credential schemas list
│   │   │
│   │   ├── verifier/
│   │   │   ├── layout.tsx            # Verifier shell
│   │   │   ├── page.tsx              # Dashboard — verification stats + recent results
│   │   │   ├── requests/
│   │   │   │   └── new/
│   │   │   │       └── page.tsx      # Create verification request (types → claims → policies → QR)
│   │   │   ├── results/
│   │   │   │   ├── page.tsx          # Results list
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Result detail (verification checks pipeline)
│   │   │   └── policies/
│   │   │       └── page.tsx          # Verification policies CRUD
│   │   │
│   │   └── admin/
│   │       ├── layout.tsx            # Admin shell
│   │       ├── issuers/
│   │       │   └── page.tsx          # Trusted issuers management
│   │       └── schemas/
│   │           └── page.tsx          # Schema registry
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui base components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ... (added via npx shadcn@latest add)
│   │   │
│   │   ├── credential/               # Credential-specific components
│   │   │   ├── credential-card.tsx    # Card with issuer badge, type, claims preview, status
│   │   │   ├── credential-detail.tsx  # Full credential view with all claims
│   │   │   ├── claims-list.tsx        # Disclosed/undisclosed claims with SD toggles
│   │   │   ├── status-badge.tsx       # Active/Revoked/Suspended/Expired badge
│   │   │   ├── issuer-badge.tsx       # Issuer name + trust indicator
│   │   │   └── credential-type-icon.tsx # Icon per credential type
│   │   │
│   │   ├── verification/             # Verification-specific components
│   │   │   ├── verification-result.tsx    # Full result with all checks
│   │   │   ├── check-item.tsx             # Single check (signature ✓, trust ✗, etc.)
│   │   │   ├── verification-pipeline.tsx  # Animated pipeline visualization
│   │   │   └── policy-badge.tsx           # Policy name + pass/fail
│   │   │
│   │   ├── qr/                       # QR code components
│   │   │   ├── qr-display.tsx         # QR code with offer/request URI
│   │   │   └── qr-scanner.tsx         # Camera-based QR scanner
│   │   │
│   │   ├── consent/                  # Consent components
│   │   │   ├── consent-dialog.tsx     # "Allow/Deny" with disclosure breakdown
│   │   │   └── consent-history.tsx    # Table of past consent records
│   │   │
│   │   ├── flow/                     # Multi-step flow components
│   │   │   ├── step-wizard.tsx        # Step indicator + navigation
│   │   │   └── flow-step.tsx          # Individual step wrapper
│   │   │
│   │   ├── dashboard/                # Dashboard components
│   │   │   ├── stat-card.tsx          # Metric card (total, active, revoked)
│   │   │   ├── recent-activity.tsx    # Recent issuances/verifications table
│   │   │   └── mini-chart.tsx         # Small chart for trends
│   │   │
│   │   └── layout/                   # Layout components
│   │       ├── app-shell.tsx          # Sidebar + header + main content
│   │       ├── sidebar.tsx            # Navigation sidebar per role
│   │       ├── header.tsx             # Top bar with role indicator
│   │       ├── role-selector.tsx      # Landing page role cards
│   │       └── empty-state.tsx        # "No credentials yet" placeholder
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts             # Base fetch wrapper (baseUrl, error handling)
│   │   │   ├── issuer.ts             # Issuer API calls
│   │   │   ├── wallet.ts             # Wallet API calls
│   │   │   ├── verifier.ts           # Verifier API calls
│   │   │   ├── trust.ts              # Trust registry API calls
│   │   │   └── status.ts             # Status API calls
│   │   ├── constants.ts              # Routes, credential types, role configs
│   │   ├── utils.ts                  # cn(), formatDate, truncateDid
│   │   └── types.ts                  # Frontend-specific types
│   │
│   ├── hooks/
│   │   ├── use-credentials.ts        # Fetch/manage wallet credentials
│   │   ├── use-verification.ts       # Verification request/result polling
│   │   ├── use-qr-scanner.ts         # QR scanning hook
│   │   └── use-role.ts               # Current role context
│   │
│   └── styles/
│       └── globals.css               # Tailwind base + custom CSS variables
│
├── public/
│   ├── fonts/                        # Custom fonts
│   └── images/                       # Logos, illustrations
│
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── components.json                   # shadcn/ui config
└── package.json
```

---

## 4. Design System

### 4.1 Design Direction

**Aesthetic:** "Digital Vault" — secure, structured, premium, trustworthy.

- Dark mode primary (feels secure, premium)
- Clean, structured layouts with generous whitespace
- Credential cards as first-class visual objects
- Verification results as visual pipeline (animated checkmarks)
- Subtle animations that convey security and trust

### 4.2 Color Tokens (CSS Variables)

> **Skill:** Invoke `/ui-ux-pro-max` with this prompt to finalize:
>
> *"Define a color palette for TrustVault — a verifiable credential platform. Needs to feel secure, trustworthy, modern, premium. Dark mode primary. Suggest: base neutrals (5 shades), primary accent, success, warning, danger, info. Avoid generic SaaS blue. Consider deep navy/slate base with teal or emerald accent."*

**Preliminary tokens (to be refined by skill):**

```css
:root {
  /* Base */
  --background: 222 47% 6%;        /* Deep navy-black */
  --foreground: 210 20% 95%;       /* Near white */
  --muted: 215 20% 15%;            /* Dark surface */
  --muted-foreground: 215 15% 55%; /* Muted text */
  --border: 215 20% 18%;           /* Subtle borders */

  /* Primary — Teal/Emerald accent */
  --primary: 168 70% 45%;          /* Teal accent */
  --primary-foreground: 0 0% 100%;

  /* Status */
  --success: 152 60% 45%;          /* Verified / Active */
  --warning: 38 92% 50%;           /* Pending / Suspended */
  --destructive: 0 72% 51%;        /* Revoked / Error */
  --info: 210 70% 55%;             /* Informational */

  /* Credential type accents */
  --credential-education: 262 60% 55%;   /* Purple */
  --credential-income: 168 70% 45%;      /* Teal */
  --credential-identity: 38 92% 50%;     /* Amber */
}
```

### 4.3 Typography

> **Skill:** Invoke `/ui-ux-pro-max` with this prompt to finalize:
>
> *"Suggest a typography system for a credential/trust platform. Need: display font (distinctive, not generic), body font (highly legible), mono font (for DIDs, hashes). No Inter, Roboto, or Arial. Consider: Instrument Sans, Satoshi, General Sans, Space Grotesk, JetBrains Mono."*

**Preliminary:**

```css
--font-display: 'Instrument Sans', sans-serif;   /* Headlines */
--font-body: 'Satoshi', sans-serif;               /* Body text */
--font-mono: 'JetBrains Mono', monospace;         /* DIDs, hashes, JWTs */
```

**Scale (1.25 ratio):**

| Token | Size | Use |
|---|---|---|
| `text-xs` | 12px | Badges, captions |
| `text-sm` | 14px | Secondary text, table cells |
| `text-base` | 16px | Body text |
| `text-lg` | 20px | Section headers |
| `text-xl` | 24px | Card titles |
| `text-2xl` | 30px | Page titles |
| `text-3xl` | 36px | Hero text |
| `text-4xl` | 48px | Landing page headline |

### 4.4 Spacing

4px base grid. All spacing uses multiples of 4:

```
4px (1), 8px (2), 12px (3), 16px (4), 20px (5), 24px (6), 32px (8), 40px (10), 48px (12), 64px (16)
```

### 4.5 Credential Card Styling

Each credential type has a distinct visual identity:

| Credential Type | Accent Color | Icon | Border Gradient |
|---|---|---|---|
| Education | Purple (`#7C3AED`) | GraduationCap | Purple → Indigo |
| Income | Teal (`#14B8A6`) | CurrencyDollar | Teal → Emerald |
| Identity | Amber (`#F59E0B`) | IdentificationCard | Amber → Orange |

---

## 5. Key UX Flows

### 5.1 Credential Receive Flow (Wallet)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1      │    │   Step 2      │    │   Step 3      │    │   Step 4      │
│  Scan QR or   │───►│  Preview      │───►│  Confirm      │───►│  Success!     │
│  Paste URI    │    │  Offer Details │    │  Receipt      │    │  Card Added   │
│               │    │               │    │               │    │               │
│  [QR Scanner] │    │  Issuer: SBI  │    │  [Receive]    │    │  ✓ Stored in  │
│  [Paste URI]  │    │  Type: Income │    │  [Cancel]     │    │    Wallet     │
│               │    │  Claims: ...  │    │               │    │               │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 5.2 Credential Present Flow (Wallet)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1      │    │   Step 2      │    │   Step 3      │    │   Step 4      │    │   Step 5      │
│  Scan Request │───►│  Select       │───►│  Choose       │───►│  Consent      │───►│  Result       │
│  QR / URI     │    │  Credentials  │    │  Disclosures  │    │  Dialog       │    │               │
│               │    │               │    │               │    │               │    │               │
│  HomeFirst    │    │  ☑ Income     │    │  ☑ Income     │    │  HomeFirst    │    │  ✓ Verified   │
│  Finance      │    │  ☑ Education  │    │  ☐ Employer   │    │  wants:       │    │  Presentation │
│  requests:    │    │  ☐ Identity   │    │  ☑ Degree     │    │  - Income     │    │  Accepted     │
│  Income +     │    │               │    │  ☐ GPA        │    │  - Degree     │    │               │
│  Education    │    │               │    │               │    │  [Allow][Deny]│    │               │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 5.3 Credential Issue Flow (Issuer)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1      │    │   Step 2      │    │   Step 3      │    │   Step 4      │
│  Select       │───►│  Fill Claims  │───►│  Generate     │───►│  Track        │
│  Schema       │    │  (Dynamic)    │    │  Offer        │    │  Status       │
│               │    │               │    │               │    │               │
│  ○ Education  │    │  Name: ___    │    │  ┌─────────┐  │    │  ● Pending    │
│  ● Income     │    │  Income: ___  │    │  │ QR Code │  │    │  ○ Issued     │
│  ○ Identity   │    │  Employer: __ │    │  └─────────┘  │    │  ○ Received   │
│               │    │  Currency: __ │    │  [Copy URI]   │    │               │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 5.4 Verification Flow (Verifier)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1      │    │   Step 2      │    │   Step 3      │    │   Step 4      │
│  Configure    │───►│  Generate     │───►│  Wait for     │───►│  View         │
│  Request      │    │  Request      │    │  Response     │    │  Result       │
│               │    │               │    │               │    │               │
│  Types:       │    │  ┌─────────┐  │    │  ⏳ Waiting   │    │  ✓ Signature  │
│  ☑ Income     │    │  │ QR Code │  │    │  for wallet   │    │  ✓ Status     │
│  ☑ Education  │    │  └─────────┘  │    │  to respond   │    │  ✓ Trust      │
│  Claims: ...  │    │  [Copy URI]   │    │  [Cancel]     │    │  ✓ Policy     │
│  Policies: .. │    │               │    │               │    │  → VERIFIED   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 5.5 Verification Result Detail

```
┌─────────────────────────────────────────────────┐
│  Verification Result: VERIFIED ✓                 │
│─────────────────────────────────────────────────│
│                                                   │
│  Checks Pipeline:                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────┐│
│  │Signature│─►│ Status  │─►│  Trust  │─►│Policy││
│  │   ✓     │  │   ✓     │  │   ✓     │  │  ✓  ││
│  └─────────┘  └─────────┘  └─────────┘  └─────┘│
│                                                   │
│  Credentials Received:                            │
│  ┌───────────────────────────────────────────┐   │
│  │ 📄 Income Credential (TrustBank India)    │   │
│  │    Annual Income: ₹95,00,000              │   │
│  │    Currency: INR                           │   │
│  │    Status: Active ✓                        │   │
│  └───────────────────────────────────────────┘   │
│  ┌───────────────────────────────────────────┐   │
│  │ 🎓 Education Credential (NTU)             │   │
│  │    Degree: MSc Computer Science            │   │
│  │    Institution: National Technical Univ.   │   │
│  │    Status: Active ✓                        │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

---

## 6. Milestone Plan

### FM1: Foundation + Design System

**Objective:** Next.js app scaffold, design system, shared components, layout shells.

| # | Task | Skill to Use |
|---|---|---|
| 1 | Next.js 14 App Router setup with Tailwind + shadcn/ui | — |
| 2 | Define color palette and typography | `/ui-ux-pro-max` |
| 3 | Configure shadcn/ui components (button, card, dialog, table, badge, input, select, switch, tabs, skeleton, tooltip) | — |
| 4 | Build AppShell layout (sidebar + header + main) | `/frontend-design` |
| 5 | Build role selector landing page | `/frontend-design` |
| 6 | Build CredentialCard compound component | `/composition-patterns` |
| 7 | Build StatusBadge, IssuerBadge, CredentialTypeIcon | — |
| 8 | Build StepWizard flow component | `/composition-patterns` |
| 9 | Build EmptyState component | — |
| 10 | Setup API client (`lib/api/client.ts`) | — |
| 11 | Configure fonts, globals.css, theme tokens | `/ui-ux-pro-max` |

**Skill Prompts:**

```
/ui-ux-pro-max
"Define a complete design system for TrustVault — a verifiable credential platform.
I need: color palette (dark mode primary, deep navy/slate base, teal/emerald accent,
status colors for verified/pending/revoked/expired), typography system (distinctive
display font, legible body font, mono for DIDs — no Inter/Roboto/Arial), spacing
scale (4px base), and credential type accent colors (education=purple, income=teal,
identity=amber). The aesthetic should feel: secure, trustworthy, modern, premium.
Not generic SaaS."
```

```
/frontend-design
"Build the AppShell layout for TrustVault. It has a collapsible sidebar navigation
(role-specific items), a top header with role badge and current page title, and a
main content area. Dark mode. The sidebar shows: for Wallet — Dashboard, Receive,
Present, History; for Issuer — Dashboard, New Offer, Credentials, Schemas; for
Verifier — Dashboard, New Request, Results, Policies; for Admin — Issuers, Schemas.
Use shadcn/ui components, Tailwind, Phosphor icons. Tone: secure vault aesthetic."
```

```
/frontend-design
"Build the TrustVault landing page with role selector. Four cards: Wallet (Shield icon),
Issuer (Stamp icon), Verifier (MagnifyingGlass icon), Admin (GearSix icon). Each card
has: role name, one-line description, 'Enter' button. Dark background, subtle gradient,
clean layout. The page should feel like entering a secure vault. Use Framer Motion for
card hover effects and entrance animation."
```

```
/composition-patterns
"Build a CredentialCard compound component for TrustVault. It needs:
- CredentialCard (wrapper with gradient border based on credential type)
- CredentialCard.Header (issuer badge + credential type icon + type name)
- CredentialCard.Claims (preview of 2-3 key claims)
- CredentialCard.Footer (status badge + issued date)
Props: credential object with type, issuer, claims, status, issuedAt.
Use React context for shared state within compound component."
```

**Exit Criteria:**
- [ ] `pnpm dev` starts Next.js app at localhost:3001
- [ ] Landing page with 4 role cards renders
- [ ] AppShell layout with sidebar works for all roles
- [ ] CredentialCard component renders with sample data
- [ ] Design tokens (colors, fonts, spacing) applied globally
- [ ] All shadcn/ui base components installed

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm1): frontend foundation — next.js, design system, shared components" && git push origin main
```

---

### FM2: Wallet UI

**Objective:** Complete wallet interface — dashboard, credential detail, receive, present flows.

| # | Task | Skill to Use |
|---|---|---|
| 1 | Wallet dashboard — credential cards grid with filtering | `/frontend-design` |
| 2 | Credential detail page — full claims, SD claims, issuer, status | `/frontend-design` |
| 3 | ClaimsList component — disclosed/undisclosed with toggle switches | `/composition-patterns` |
| 4 | Receive credential flow (3-step wizard) | `/frontend-design` |
| 5 | QR scanner component | — |
| 6 | Present credential flow (5-step wizard) | `/frontend-design` |
| 7 | ConsentDialog component | `/bencium-controlled-ux-designer` |
| 8 | Consent history page | — |
| 9 | Connect wallet pages to backend APIs | `/react-best-practices` |
| 10 | Accessibility audit of wallet UI | `/accesslint-refactor` |

**Skill Prompts:**

```
/frontend-design
"Build the TrustVault wallet dashboard page. It shows a grid of CredentialCard
components. Top section has: total credentials count, filter tabs (All, Education,
Income, Identity), and a 'Receive New' button. Empty state when no credentials:
illustration + 'No credentials yet. Receive your first credential.' + action button.
Cards are clickable → navigate to detail page. Dark mode, vault aesthetic. Use shadcn/ui
Card, Badge, Tabs. Animate cards entrance with Framer Motion stagger."
```

```
/frontend-design
"Build the credential detail page for TrustVault wallet. Shows: credential type header
with gradient accent, issuer badge with trust indicator, full claims list with
disclosed/undisclosed sections (SD claims have lock/unlock icons), credential metadata
(issued date, expiry, format, DID), status badge, raw credential toggle (shows
SD-JWT-VC string in mono font). Actions: Delete, Present. Dark mode. Use a clean
card-based layout with sections."
```

```
/frontend-design
"Build the 'Receive Credential' flow for TrustVault wallet. 3-step wizard:
Step 1: Scan QR code (camera view) OR paste credential offer URI (text input).
Step 2: Preview — show issuer name, credential type, claims that will be issued,
expiry. Ask 'Do you want to receive this credential?'
Step 3: Success — animated checkmark, credential card preview, 'View in Wallet' button.
Use StepWizard component. Dark mode. Framer Motion transitions between steps."
```

```
/frontend-design
"Build the 'Present Credential' flow for TrustVault wallet. 5-step wizard:
Step 1: Scan verification request QR or paste URI. Show verifier name + what they're
requesting.
Step 2: Select which credentials to present (checkboxes on credential cards). Show
which ones match the request.
Step 3: Choose selective disclosures — per credential, show toggleable switches for
each claim. Required claims are locked on. Optional claims can be toggled off.
Real-time preview of what will be shared.
Step 4: Consent dialog — clear summary: 'HomeFirst Finance will receive: Annual Income
from TrustBank India, Degree from NTU. Purpose: Loan eligibility.' [Allow] [Deny].
Step 5: Result — Verified/Rejected with animation.
Dark mode. This is the MOST IMPORTANT flow in the app."
```

```
/bencium-controlled-ux-designer
"Review the ConsentDialog design for TrustVault. It shows when a user is about to
share credentials with a verifier. Needs: verifier name + logo, list of credentials
being shared, per-credential list of claims being disclosed, purpose statement,
two buttons (Allow in primary, Deny in outline). Must feel serious — this is a
privacy decision. Should I use a full-screen modal, a bottom sheet, or a centered
dialog? What visual hierarchy makes the shared data most clear? Present options."
```

```
/accesslint-refactor
"Audit the TrustVault wallet UI (src/app/wallet/) for WCAG 2.1 AA compliance.
Check: credential cards have proper aria-labels, form inputs have labels, consent
dialog is keyboard-navigable with focus trap, QR scanner has text alternative,
color is not the only status indicator, all interactive elements have focus states."
```

**Exit Criteria:**
- [ ] Wallet dashboard shows credential cards from API
- [ ] Credential detail page shows all claims with SD indicators
- [ ] Receive flow: scan/paste → preview → confirm → stored
- [ ] Present flow: request → select → disclose → consent → result
- [ ] Consent dialog clearly shows what is being shared
- [ ] All wallet pages accessible (keyboard nav, screen reader)

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm2): wallet ui — dashboard, credential detail, receive, present flows" && git push origin main
```

---

### FM3: Issuer + Verifier + Trust Admin UI

**Objective:** Complete issuer portal, verifier portal, and trust admin interface.

| # | Task | Skill to Use |
|---|---|---|
| 1 | Issuer dashboard — stats + recent issuances table | `/frontend-design` |
| 2 | Create credential offer flow (3-step wizard) | `/frontend-design` |
| 3 | Dynamic claim form (generated from schema) | `/react-best-practices` |
| 4 | Issued credentials table with revoke action | — |
| 5 | Verifier dashboard — stats + recent results | `/frontend-design` |
| 6 | Create verification request flow (3-step wizard) | `/frontend-design` |
| 7 | Verification result detail page with pipeline viz | `/frontend-design` |
| 8 | VerificationPipeline animated component | `/frontend-design` |
| 9 | Verification policies CRUD page | — |
| 10 | Trust admin — issuers table + register form | `/frontend-design` |
| 11 | Schema registry page | — |
| 12 | Connect all pages to backend APIs | `/react-best-practices` |

**Skill Prompts:**

```
/frontend-design
"Build the issuer dashboard for TrustVault. Top row: 3 stat cards (Total Issued,
Active, Revoked) with mini trend indicators. Below: recent issuances table with
columns: Credential Type, Subject DID (truncated), Status, Issued Date, Actions
(view, revoke). 'Create New Offer' button prominent in header. Dark mode."
```

```
/frontend-design
"Build the 'Create Credential Offer' flow for TrustVault issuer portal. 3-step wizard:
Step 1: Select credential schema (Education, Income, Identity) — radio cards with
type icons and descriptions.
Step 2: Fill claims — dynamic form generated from selected schema. Required fields
marked. SD-eligible fields have a subtle indicator. Subject DID input.
Step 3: Offer generated — QR code display + copy URI button + offer expiry countdown.
Use React Hook Form + Zod for validation. Dark mode."
```

```
/frontend-design
"Build the verification result detail page for TrustVault verifier portal. This is a
KEY page. Shows:
1. Overall result: large VERIFIED/REJECTED badge with animation
2. Verification pipeline: horizontal animated flow showing each check as a node:
   Signature → Expiration → Status → Trust → Policy. Each node is green (pass) or
   red (fail) with connecting arrows. Animate sequentially on page load.
3. Credential data received: cards per credential showing disclosed claims.
4. Metadata: verifier DID, timestamp, nonce, policies applied.
Dark mode. This should be the most visually impressive page."
```

```
/frontend-design
"Build the trust admin page for TrustVault. Two sections:
1. Trusted Issuers table: columns — Name, DID (truncated), Credential Types (badges),
   Status, Registered Date, Actions (edit, remove). 'Register New Issuer' button.
2. Register issuer dialog: form with fields — Name, DID, Description, Credential Types
   (multi-select from available schemas), Website URL.
Includes search and filter. Dark mode."
```

**Exit Criteria:**
- [ ] Issuer dashboard renders with stats and table
- [ ] Create offer flow generates QR code with valid offer URI
- [ ] Issued credentials table with working revoke button
- [ ] Verifier dashboard renders with stats and results
- [ ] Verification request flow generates QR
- [ ] Result detail page shows animated pipeline with all checks
- [ ] Trust admin can list, register, remove issuers

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm3): issuer, verifier, trust admin ui — dashboards, flows, management" && git push origin main
```

---

### FM4: E2E Flows + QR Integration

**Objective:** Wire frontend to backend, complete user journeys, QR code flows.

| # | Task | Skill to Use |
|---|---|---|
| 1 | Wire wallet receive to backend OID4VCI | `/react-best-practices` |
| 2 | Wire wallet present to backend OID4VP | `/react-best-practices` |
| 3 | Wire issuer offer creation to backend | — |
| 4 | Wire verifier request to backend | — |
| 5 | QR code generation (issuer offer + verifier request) | — |
| 6 | QR code scanning (wallet receive + present) | — |
| 7 | Full loan processing demo flow | — |
| 8 | Loading states, error states, empty states | `/ui-ux-pro-max` |
| 9 | Toast notifications for all actions | — |
| 10 | Responsive testing (mobile wallet, desktop portals) | `/ui-ux-pro-max` |

**Skill Prompts:**

```
/react-best-practices
"Review the TrustVault frontend API integration layer (src/lib/api/) for performance.
Check: no waterfall fetches, parallel requests where possible, proper loading states
with Suspense boundaries, error boundaries for API failures, SWR or fetch caching
for repeated calls (like credential list), debounced inputs for search/filter."
```

```
/ui-ux-pro-max
"Review the TrustVault frontend for interaction quality:
1. All buttons show loading spinner during async operations
2. Error messages appear near the relevant field/action
3. Empty states have helpful message + action CTA
4. Skeleton screens shown during data loading (>300ms)
5. Toast notifications for success/error on all mutations
6. Touch targets minimum 44x44px for mobile wallet
7. Mobile responsive: wallet pages work on 375px width"
```

**Exit Criteria:**
- [ ] Full flow works: Issuer creates offer → Wallet scans QR → Receives credential
- [ ] Full flow works: Verifier creates request → Wallet scans QR → Presents → Verifier sees result
- [ ] Loan processing E2E: 3 credentials issued → all stored → all verified
- [ ] Loading/error/empty states on every page
- [ ] Mobile responsive for wallet pages

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm4): e2e flows — api integration, qr codes, full user journeys" && git push origin main
```

---

### FM5: Polish — Accessibility, Animations, Compliance

**Objective:** Final quality pass — accessibility audit, animations, design compliance, responsive.

| # | Task | Skill to Use |
|---|---|---|
| 1 | Full accessibility audit | `/accesslint-refactor` |
| 2 | Web Interface Guidelines compliance review | `/web-design-guidelines` |
| 3 | Page entrance animations | `/frontend-design` |
| 4 | Credential card hover/press animations | `/frontend-design` |
| 5 | Verification pipeline sequential animation | `/frontend-design` |
| 6 | Consent dialog enter/exit animation | — |
| 7 | Dark/light mode toggle (if time) | `/ui-ux-pro-max` |
| 8 | Pre-delivery UI checklist | `/ui-ux-pro-max` |
| 9 | Playwright visual testing | `mcp__playwright__*` |
| 10 | Final responsive pass (375px, 768px, 1024px, 1280px) | — |

**Skill Prompts:**

```
/accesslint-refactor src/app/ src/components/
"Full WCAG 2.1 AA compliance audit of the entire TrustVault frontend. Check all pages
and components. Focus on: credential cards, consent dialog, QR scanner, form inputs,
table navigation, modal focus traps, color contrast in dark mode, status indicators
not relying on color alone, keyboard navigation through all flows."
```

```
/web-design-guidelines src/app/ src/components/
"Review the TrustVault frontend against Web Interface Guidelines. Check all pages
for compliance with the latest standards. Report findings with file:line notation."
```

```
/frontend-design
"Add polish animations to TrustVault:
1. Page transitions: slide + fade between routes using Framer Motion AnimatePresence
2. Credential cards: staggered entrance on dashboard, subtle scale on hover
3. Verification pipeline: sequential node animation (each check lights up in order)
4. Success states: animated checkmark (draw path animation)
5. QR code: subtle pulse animation while waiting for scan
6. Consent dialog: slide up from bottom with backdrop blur
All animations should respect prefers-reduced-motion."
```

```
/ui-ux-pro-max
"Run the pre-delivery checklist on TrustVault frontend:
Visual Quality: icons consistent? semantic tokens? brand assets?
Interaction: touch targets 44px? pressed feedback? disabled states?
Dark Mode: contrast >=4.5:1? borders visible? both themes tested?
Layout: safe areas? scroll not hidden? verified on multiple sizes?
Accessibility: labels? hints? color not only indicator? reduced motion?"
```

**Playwright MCP Testing:**
```
Use mcp__playwright__browser_navigate to load each page.
Use mcp__playwright__browser_snapshot to verify DOM structure.
Use mcp__playwright__browser_take_screenshot at 375px, 768px, 1280px widths.
Verify all interactive elements are clickable via mcp__playwright__browser_click.
```

**Exit Criteria:**
- [ ] Zero WCAG 2.1 AA violations (critical/high)
- [ ] Web Interface Guidelines compliance review passed
- [ ] Page transitions and micro-interactions smooth
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Responsive at 375px, 768px, 1024px, 1280px
- [ ] Pre-delivery UI checklist all green
- [ ] Playwright screenshots captured for all key pages

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm5): polish — accessibility, animations, responsive, compliance audit" && git push origin main
```

---

## 7. API Integration Map

Frontend pages mapped to backend endpoints:

| Frontend Page | Backend Endpoint | Method |
|---|---|---|
| **Wallet Dashboard** | `/wallet/credentials?holderId=xxx` | GET |
| **Credential Detail** | `/wallet/credentials/:id` | GET |
| **Credential Claims** | `/wallet/credentials/:id/claims` | GET |
| **Receive Credential** | `/wallet/credentials/receive` | POST |
| **Present Credential** | `/wallet/presentations/create` | POST |
| **Consent History** | `/wallet/consent/history?holderId=xxx` | GET |
| **Delete Credential** | `/wallet/credentials/:id` | DELETE |
| **Issuer Dashboard** | `/issuer/credentials` + `/issuer/schemas` | GET |
| **Create Offer** | `/issuer/offers` | POST |
| **Revoke Credential** | `/issuer/credentials/:id/revoke` | POST |
| **List Schemas** | `/issuer/schemas` | GET |
| **Verifier Dashboard** | `/verifier/presentations` (list) | GET |
| **Create Request** | `/verifier/presentations/request` | POST |
| **View Result** | `/verifier/presentations/:id` | GET |
| **List Policies** | `/verifier/policies` | GET |
| **Create Policy** | `/verifier/policies` | POST |
| **List Issuers** | `/trust/issuers` | GET |
| **Register Issuer** | `/trust/issuers` | POST |
| **Remove Issuer** | `/trust/issuers/:did` | DELETE |
| **Verify Trust** | `/trust/verify?issuerDid=x&credentialType=y` | GET |
| **Status List** | `/status/lists/:id` | GET |

---

## 8. Manual TODOs

### Before Starting

- [ ] Backend API running (milestones M1-M5 complete)
- [ ] Confirm API base URL (default: `http://localhost:3000`)
- [ ] Decide on Google Fonts or self-hosted fonts

### Design Decisions (Finalize with Skills)

- [ ] Run `/ui-ux-pro-max` for color palette finalization
- [ ] Run `/ui-ux-pro-max` for typography finalization
- [ ] Run `/bencium-controlled-ux-designer` to review design choices before coding

### After Development

- [ ] Run `/accesslint-refactor` for full accessibility audit
- [ ] Run `/web-design-guidelines` for compliance review
- [ ] Capture Playwright screenshots at all breakpoints
- [ ] Test full E2E flow: issue → receive → present → verify

---

## 9. Dependency on Backend

```
Backend Milestones          Frontend Milestones

M1: Foundation    ─────────► FM1: Can start (no API needed)
M2: Issuer        ─────────► FM2+FM3: Can use mock data, wire later
M3: Wallet+Status ─────────► FM4: Wire wallet to real APIs
M4: Verifier+Trust─────────► FM4: Wire verifier/trust to real APIs
M5: E2E           ─────────► FM4: Full E2E with real backend
M6: Demo Ready    ─────────► FM5: Polish + final testing
```

**FM1 can start immediately** — no backend dependency. Use mock data for FM2-FM3, wire to real APIs in FM4.

---

## 10. Definition of Done (Frontend)

- [ ] All 4 surfaces working: Wallet, Issuer, Verifier, Admin
- [ ] All UX flows complete: receive, present, issue, verify
- [ ] QR code generation and scanning working
- [ ] Consent dialog with selective disclosure toggles
- [ ] Verification result with animated pipeline
- [ ] Mobile responsive (wallet pages at 375px)
- [ ] WCAG 2.1 AA compliant
- [ ] Web Interface Guidelines compliant
- [ ] Page transitions and micro-interactions
- [ ] Connected to backend APIs
- [ ] Total cost: **$0**

---

*Document Version: 1.0 | Created: 2026-03-30 | Stack: Next.js + shadcn/ui + Tailwind + Framer Motion*
