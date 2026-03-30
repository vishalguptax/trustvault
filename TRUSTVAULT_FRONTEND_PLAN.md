# TrustVault — Frontend & UI/UX Plan

## Milestone-Based | Mobile Wallet (Expo) + Web Portals (Next.js) | Zero Budget

> **Scope:** Mobile wallet app + Web portals (Issuer, Verifier, Trust Admin).
> **Backend:** Consumed via REST APIs (see `TRUSTVAULT_EXECUTION_PLAN.md` Section 3).
> **Skills Used:** All 8 available skills mapped to specific milestones with exact prompts.

---

## 1. Frontend Surfaces

| Surface | Platform | Primary User | Purpose |
|---|---|---|---|
| **Wallet App** | **React Native (Expo)** | Individual holder | Receive, store, manage, present credentials |
| **Issuer Portal** | **Next.js (Web)** | Organization (bank, university) | Create offers, issue credentials, revoke |
| **Verifier Portal** | **Next.js (Web)** | Organization (loan company) | Create verification requests, view results |
| **Trust Admin** | **Next.js (Web)** | Platform admin | Manage trusted issuers, schemas, policies |
| **Landing Page** | **Next.js (Web)** | Everyone | Platform overview, links to portals |

**Why this split:**
- Wallets live on phones — QR scanning from phone camera is the natural UX
- Issuer/Verifier/Admin are org dashboards — desktop web is the right platform
- Backend APIs are identical — zero backend changes
- Demo: scan QR from real phone → credential appears live

---

## 2. Tech Stack

### Mobile Wallet (React Native + Expo)

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Expo SDK 51+ (managed workflow) | Zero native config, Expo Go for instant testing |
| **Navigation** | Expo Router (file-based) | Same mental model as Next.js App Router |
| **Styling** | NativeWind (Tailwind for RN) | Consistent with web, utility-first |
| **Components** | Custom + React Native Paper or Tamagui | Native feel |
| **Icons** | Phosphor Icons (`phosphor-react-native`) | Consistent with web |
| **Animation** | React Native Reanimated 3 | GPU-accelerated, 60fps |
| **QR Code** | `expo-camera` (scan) + `react-native-qrcode-svg` (display) | Native camera access |
| **State** | Zustand | Lightweight, works in RN |
| **Storage** | `expo-secure-store` | Encrypted credential storage |
| **HTTP** | Native `fetch` | Works in Expo |
| **Haptics** | `expo-haptics` | Feedback on consent, receive, verify |

### Web Portals (Next.js)

| Layer | Technology | Why |
|---|---|---|
| **Framework** | Next.js 14+ (App Router) | SSR, file-based routing |
| **Styling** | Tailwind CSS 3.4+ | Utility-first, design system via CSS variables |
| **Components** | shadcn/ui | Accessible, Radix primitives |
| **Icons** | Phosphor Icons (`@phosphor-icons/react`) | Consistent with mobile |
| **Toasts** | Sonner | Toast notifications |
| **Animation** | Framer Motion | Page transitions, micro-interactions |
| **QR Code** | `qrcode.react` (display only — issuers/verifiers show QR, wallet scans) |  |
| **Forms** | React Hook Form + Zod | Type-safe validation |
| **Charts** | Recharts | Dashboard statistics |

### Shared

| Layer | Technology | Why |
|---|---|---|
| **Package Manager** | pnpm | Monorepo consistency |
| **API Types** | `packages/shared` | Shared TypeScript types between web, mobile, backend |
| **Monorepo** | Turborepo | Orchestrate all apps |

---

## 3. Folder Structure

```
trustvault/
├── apps/
│   ├── api/                          # Backend (NestJS) — already built
│   │
│   ├── mobile/                       # Mobile Wallet (Expo + React Native)
│   │   ├── app/                      # Expo Router (file-based)
│   │   │   ├── _layout.tsx           # Root layout (theme, fonts, providers)
│   │   │   ├── index.tsx             # Home — credential cards list
│   │   │   ├── credential/
│   │   │   │   └── [id].tsx          # Credential detail (claims, status, issuer)
│   │   │   ├── receive.tsx           # Receive credential (scan QR → preview → confirm)
│   │   │   ├── present.tsx           # Present credential (request → select → disclose → consent)
│   │   │   ├── scanner.tsx           # QR scanner (camera view)
│   │   │   └── history.tsx           # Consent history
│   │   ├── components/
│   │   │   ├── credential-card.tsx   # Card with gradient border, issuer, claims preview
│   │   │   ├── claims-list.tsx       # Disclosed/undisclosed claims with toggles
│   │   │   ├── status-badge.tsx      # Active/Revoked/Suspended/Expired
│   │   │   ├── issuer-badge.tsx      # Issuer name + trust indicator
│   │   │   ├── consent-sheet.tsx     # Bottom sheet consent dialog
│   │   │   ├── step-indicator.tsx    # Multi-step flow progress
│   │   │   ├── qr-scanner.tsx        # Camera QR scanner wrapper
│   │   │   ├── qr-display.tsx        # QR code display
│   │   │   ├── empty-state.tsx       # No credentials illustration
│   │   │   └── animated-check.tsx    # Success checkmark animation
│   │   ├── lib/
│   │   │   ├── api.ts                # API client (fetch wrapper)
│   │   │   ├── store.ts              # Zustand store
│   │   │   ├── secure-storage.ts     # expo-secure-store wrapper
│   │   │   └── constants.ts          # API URL, credential types
│   │   ├── hooks/
│   │   │   ├── use-credentials.ts    # Credential CRUD
│   │   │   └── use-scanner.ts        # QR scanning
│   │   ├── app.json                  # Expo config
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                          # Web Portals (Next.js)
│       ├── src/
│       │   ├── app/                   # Next.js App Router
│       │   │   ├── layout.tsx         # Root layout
│       │   │   ├── page.tsx           # Landing page
│       │   │   ├── issuer/
│       │   │   │   ├── layout.tsx     # Issuer shell (sidebar + header)
│       │   │   │   ├── page.tsx       # Dashboard — stats + recent issuances
│       │   │   │   ├── offers/
│       │   │   │   │   └── new/
│       │   │   │   │       └── page.tsx  # Create offer (schema → claims → QR)
│       │   │   │   ├── credentials/
│       │   │   │   │   └── page.tsx   # Issued credentials + revoke
│       │   │   │   └── schemas/
│       │   │   │       └── page.tsx   # Schemas list
│       │   │   ├── verifier/
│       │   │   │   ├── layout.tsx     # Verifier shell
│       │   │   │   ├── page.tsx       # Dashboard — stats + recent results
│       │   │   │   ├── requests/
│       │   │   │   │   └── new/
│       │   │   │   │       └── page.tsx  # Create request (types → claims → policies → QR)
│       │   │   │   ├── results/
│       │   │   │   │   ├── page.tsx   # Results list
│       │   │   │   │   └── [id]/
│       │   │   │   │       └── page.tsx  # Result detail (pipeline viz)
│       │   │   │   └── policies/
│       │   │   │       └── page.tsx   # Policies CRUD
│       │   │   └── admin/
│       │   │       ├── layout.tsx     # Admin shell
│       │   │       ├── issuers/
│       │   │       │   └── page.tsx   # Trusted issuers management
│       │   │       └── schemas/
│       │   │           └── page.tsx   # Schema registry
│       │   ├── components/
│       │   │   ├── ui/                # shadcn/ui components
│       │   │   ├── credential/        # CredentialCard, ClaimsList, StatusBadge
│       │   │   ├── verification/      # VerificationResult, Pipeline, CheckItem
│       │   │   ├── qr/                # QRDisplay (issuers/verifiers show QR for wallets to scan)
│       │   │   ├── dashboard/         # StatCard, RecentActivity, MiniChart
│       │   │   └── layout/            # AppShell, Sidebar, Header
│       │   ├── lib/
│       │   │   ├── api/               # API client per domain
│       │   │   ├── constants.ts
│       │   │   ├── utils.ts
│       │   │   └── types.ts
│       │   └── styles/
│       │       └── globals.css
│       ├── next.config.js
│       ├── tailwind.config.ts
│       ├── components.json            # shadcn/ui config
│       └── package.json
│
├── packages/
│   └── shared/                        # Shared types between all apps
│       ├── src/
│       │   ├── types/                 # VC, DID, API response types
│       │   └── constants.ts           # Credential types, status enums
│       └── package.json
```

---

## 4. Design System (Shared Across Mobile + Web)

### 4.1 Design Direction

**Aesthetic:** "Digital Vault" — secure, structured, premium, trustworthy.

- Dark mode primary (both mobile and web)
- Credential cards as first-class visual objects with type-specific gradient borders
- Verification results as visual pipeline (animated checkmarks)
- Mobile: native feel with haptic feedback on key actions
- Web: dashboard feel with data density

### 4.2 Color Tokens

> **Skill:** Invoke `/ui-ux-pro-max` with this prompt:
>
> *"Define a color palette for TrustVault — a verifiable credential platform. Dark mode primary. Deep navy/slate base with teal/emerald accent. Status colors: emerald (verified/active), amber (pending/suspended), red (revoked/error), info blue. Credential type accents: education=purple, income=teal, identity=amber. Must work on both mobile (React Native) and web (Tailwind CSS variables). Avoid generic SaaS blue."*

**Preliminary tokens:**

```
Base:       #0B1120 (deep navy), #111827 (surface), #1F2937 (muted), #6B7280 (muted text), #F9FAFB (foreground)
Primary:    #14B8A6 (teal accent)
Success:    #10B981 (emerald — verified/active)
Warning:    #F59E0B (amber — pending/suspended)
Danger:     #EF4444 (red — revoked/error)
Info:       #3B82F6 (blue — informational)

Credential Accents:
  Education: #7C3AED (purple)
  Income:    #14B8A6 (teal)
  Identity:  #F59E0B (amber)
```

### 4.3 Typography

> **Skill:** Invoke `/ui-ux-pro-max` for finalization.

| Role | Mobile (System) | Web (Google Fonts) |
|---|---|---|
| Display/Heading | System bold (SF Pro / Roboto) | Instrument Sans |
| Body | System regular | Satoshi |
| Mono (DIDs, hashes) | System mono (SF Mono / Roboto Mono) | JetBrains Mono |

Mobile uses system fonts for native feel + performance. Web uses custom fonts for brand identity.

### 4.4 Credential Card Design

Each credential type has a distinct visual identity (shared across mobile + web):

| Type | Accent | Icon | Gradient Border |
|---|---|---|---|
| Education | Purple `#7C3AED` | GraduationCap | Purple → Indigo |
| Income | Teal `#14B8A6` | CurrencyDollar | Teal → Emerald |
| Identity | Amber `#F59E0B` | IdentificationCard | Amber → Orange |

---

## 5. Key UX Flows

### 5.1 Credential Receive (Mobile Wallet)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1      │    │   Step 2      │    │   Step 3      │    │   Step 4      │
│  Scan QR      │───►│  Preview      │───►│  Confirm      │───►│  Success!     │
│  (Camera)     │    │  Offer        │    │  Receipt      │    │  ✓ Stored     │
│               │    │               │    │               │    │               │
│  Point camera │    │  Issuer: SBI  │    │  [Receive]    │    │  Haptic buzz  │
│  at QR code   │    │  Type: Income │    │  [Cancel]     │    │  Card flies   │
│  on issuer's  │    │  Claims: ...  │    │               │    │  into wallet  │
│  screen       │    │               │    │               │    │               │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘

Issuer shows QR on web portal → User scans with phone → Credential appears in wallet
```

### 5.2 Credential Present (Mobile Wallet)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1      │    │   Step 2      │    │   Step 3      │    │   Step 4      │    │   Step 5      │
│  Scan Request │───►│  Select       │───►│  Choose       │───►│  Consent      │───►│  Result       │
│  QR (Camera)  │    │  Credentials  │    │  Disclosures  │    │  Bottom Sheet │    │               │
│               │    │               │    │               │    │               │    │               │
│  Verifier's   │    │  ☑ Income     │    │  ☑ Income     │    │  HomeFirst    │    │  ✓ Verified   │
│  screen shows │    │  ☑ Education  │    │  ☐ Employer   │    │  wants:       │    │  Haptic buzz  │
│  QR code      │    │  ☐ Identity   │    │  ☑ Degree     │    │  - Income     │    │  Confetti     │
│               │    │               │    │  ☐ GPA        │    │  - Degree     │    │               │
│               │    │               │    │               │    │  [Allow][Deny]│    │               │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘

Verifier shows QR on web portal → User scans with phone → Selects + consents → Verifier sees result on web
```

### 5.3 Credential Issue (Web — Issuer Portal)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1      │    │   Step 2      │    │   Step 3      │    │   Step 4      │
│  Select       │───►│  Fill Claims  │───►│  Show QR      │───►│  Track        │
│  Schema       │    │  (Dynamic)    │    │  (User scans) │    │  Status       │
│               │    │               │    │               │    │               │
│  ○ Education  │    │  Name: ___    │    │  ┌─────────┐  │    │  ● Pending    │
│  ● Income     │    │  Income: ___  │    │  │ QR Code │  │    │  ● Scanned    │
│  ○ Identity   │    │  Employer: __ │    │  └─────────┘  │    │  ✓ Issued     │
│               │    │               │    │  Waiting for  │    │               │
│               │    │               │    │  wallet scan  │    │               │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 5.4 Verification (Web — Verifier Portal)

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Step 1      │    │   Step 2      │    │   Step 3      │    │   Step 4      │
│  Configure    │───►│  Show QR      │───►│  Wait for     │───►│  View         │
│  Request      │    │  (User scans) │    │  Response     │    │  Result       │
│               │    │               │    │               │    │               │
│  Types:       │    │  ┌─────────┐  │    │  ⏳ Waiting   │    │  ✓ Signature  │
│  ☑ Income     │    │  │ QR Code │  │    │  for wallet   │    │  ✓ Status     │
│  ☑ Education  │    │  └─────────┘  │    │  to scan &    │    │  ✓ Trust      │
│  Claims: ...  │    │  Waiting for  │    │  respond      │    │  ✓ Policy     │
│  Policies: .. │    │  wallet scan  │    │               │    │  → VERIFIED   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### 5.5 Demo Flow (Cross-Platform)

```
ISSUER (Web Browser)              WALLET (Phone)                VERIFIER (Web Browser)
      │                                │                               │
      │  1. Create offer               │                               │
      │  → Shows QR on screen          │                               │
      │                                │                               │
      │         ─── scans QR ──►       │                               │
      │                                │  2. Preview + Confirm         │
      │                                │  → Credential stored          │
      │                                │                               │
      │                                │                               │  3. Create request
      │                                │                               │  → Shows QR on screen
      │                                │                               │
      │                                │  ◄── scans QR ───            │
      │                                │  4. Select + Disclose         │
      │                                │  5. Consent → Allow           │
      │                                │  → VP sent to verifier        │
      │                                │                               │
      │                                │                               │  6. Result: VERIFIED ✓
      │                                │                               │  Pipeline: all checks pass
```

---

## 6. Milestone Plan

### FM1: Foundation + Design System

**Objective:** Monorepo setup for mobile + web, shared types, design tokens, base components.

| # | Task | Platform | Skill |
|---|---|---|---|
| 1 | Turborepo config for `apps/mobile`, `apps/web`, `packages/shared` | Both | — |
| 2 | Expo project setup with Expo Router | Mobile | `/react-native-skills` |
| 3 | Next.js 14 setup with App Router + shadcn/ui | Web | — |
| 4 | Shared types package (`packages/shared`) | Both | — |
| 5 | Define color palette and typography | Both | `/ui-ux-pro-max` |
| 6 | Configure NativeWind (Tailwind for RN) | Mobile | `/react-native-skills` |
| 7 | Configure Tailwind + shadcn/ui components | Web | — |
| 8 | API client for both platforms | Both | — |
| 9 | Landing page (web) | Web | `/frontend-design` |
| 10 | AppShell layout (web — sidebar + header) | Web | `/frontend-design` |

**Skill Prompts:**

```
/ui-ux-pro-max
"Define a complete design system for TrustVault — a verifiable credential platform
with a mobile wallet (React Native) and web portals (Next.js). Dark mode primary.
I need: color palette (deep navy/slate base, teal/emerald accent, status colors
for verified/pending/revoked/expired, credential type accents for education=purple,
income=teal, identity=amber), typography (system fonts for mobile, custom for web),
spacing (4px base). Must work across both platforms. Aesthetic: secure, trustworthy,
modern, premium. Not generic SaaS."
```

```
/react-native-skills
"Set up a new Expo project with Expo Router for TrustVault mobile wallet. Configure:
file-based routing, NativeWind (Tailwind for RN), expo-secure-store for credential
storage, expo-camera for QR scanning, expo-haptics for feedback, React Native
Reanimated 3 for animations, Zustand for state. Use Expo SDK 51+ managed workflow.
Follow all config and monorepo best practices."
```

```
/frontend-design
"Build the TrustVault web landing page. Dark background, vault aesthetic. Shows:
hero section with tagline ('Portable Proofs. Instant Trust.'), 3 portal cards —
Issuer Portal (Stamp icon), Verifier Portal (MagnifyingGlass icon), Trust Admin
(GearSix icon). Each card links to the respective portal. Also show 'Download Wallet'
section pointing to Expo Go. Framer Motion entrance animations. Phosphor icons."
```

```
/frontend-design
"Build the AppShell layout for TrustVault web portals. Collapsible sidebar (role-
specific nav items), top header with role badge and page title, main content area.
For Issuer: Dashboard, New Offer, Credentials, Schemas. For Verifier: Dashboard,
New Request, Results, Policies. For Admin: Issuers, Schemas. shadcn/ui, Tailwind,
Phosphor icons. Dark mode vault aesthetic."
```

**Exit Criteria:**
- [ ] `pnpm dev --filter mobile` opens Expo dev server
- [ ] `pnpm dev --filter web` opens Next.js at localhost:3001
- [ ] Shared types package imported by both apps
- [ ] Design tokens applied (colors, fonts) on both platforms
- [ ] Web landing page + AppShell layout renders
- [ ] Mobile app opens in Expo Go with basic navigation

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm1): frontend foundation — expo mobile, next.js web, design system" && git push origin main
```

---

### FM2: Mobile Wallet UI

**Objective:** Complete wallet app — dashboard, credential detail, receive, present, consent.

| # | Task | Skill |
|---|---|---|
| 1 | Wallet home — credential cards list (FlatList/FlashList) | `/react-native-skills` |
| 2 | CredentialCard component (gradient border, issuer, claims preview, status) | `/frontend-design` |
| 3 | Credential detail screen (full claims, SD indicators, issuer, status) | `/frontend-design` |
| 4 | ClaimsList component (disclosed/undisclosed toggles) | `/composition-patterns` |
| 5 | QR scanner screen (expo-camera) | `/react-native-skills` |
| 6 | Receive credential flow (scan → preview → confirm → success animation) | `/frontend-design` |
| 7 | Present credential flow (scan → select → disclose → consent → result) | `/frontend-design` |
| 8 | Consent bottom sheet (what is shared, with whom, purpose) | `/bencium-controlled-ux-designer` |
| 9 | Consent history screen | — |
| 10 | Haptic feedback on receive, consent, verify | `/react-native-skills` |
| 11 | Connect wallet to backend APIs | `/react-native-skills` |
| 12 | Accessibility audit | `/accesslint-refactor` |

**Skill Prompts:**

```
/react-native-skills
"Build the TrustVault wallet home screen. Shows a list of credential cards using
FlashList (or FlatList with proper optimization). Top section: greeting + total
credentials count + 'Scan QR' FAB button. Cards show: credential type icon with
gradient accent, issuer name, 2-3 key claims preview, status badge, issued date.
Empty state when no credentials. Pull-to-refresh. Dark mode. Use NativeWind.
Follow all list-performance rules: memoize items, stable keys, useCallback."
```

```
/frontend-design
"Build the CredentialCard component for TrustVault mobile wallet (React Native).
It has a gradient border based on credential type (education=purple, income=teal,
identity=amber). Inside: credential type icon + name, issuer badge, 2-3 key claim
values, status badge (active/revoked), issued date. Tappable → navigates to detail.
Pressable with scale feedback. Dark card surface on dark background."
```

```
/frontend-design
"Build the 'Receive Credential' flow for TrustVault mobile wallet. Multi-step:
Step 1: Camera QR scanner (full screen, overlay with scan frame guide).
Step 2: Preview — issuer name, credential type, claims to be issued. Card-style
preview of what you will receive. 'Accept' and 'Decline' buttons.
Step 3: Success — animated checkmark (Reanimated), haptic buzz, credential card
preview, 'View in Wallet' button. Card entrance animation (slide up + fade in).
React Native, Expo Router, NativeWind, Reanimated 3."
```

```
/frontend-design
"Build the 'Present Credential' flow for TrustVault mobile wallet. This is the
MOST IMPORTANT flow. Multi-step:
Step 1: Camera QR scanner — scan verifier's request QR. Show verifier name and
what they are requesting.
Step 2: Select credentials — show matching wallet credentials as selectable cards
with checkboxes. Highlight which credentials match the request.
Step 3: Choose disclosures — per selected credential, show toggleable switches for
each claim. Required claims locked on (can't toggle off). Optional claims toggleable.
Real-time preview: 'You will share: Annual Income, Degree'.
Step 4: Consent bottom sheet — slides up with backdrop blur. Shows: verifier name,
purpose, exact list of what will be shared. Large 'Allow' (primary) + 'Deny'
(outline) buttons. Haptic on both.
Step 5: Result — Verified checkmark animation or Rejected X animation.
React Native, Reanimated 3, expo-haptics."
```

```
/bencium-controlled-ux-designer
"Review the consent bottom sheet design for TrustVault mobile wallet. This is the
privacy decision moment. The user is about to share credentials with a verifier.
The sheet should show: verifier name, purpose statement, per-credential breakdown
of what will be shared (with claim names), two buttons (Allow + Deny). Should this
be a bottom sheet, full-screen modal, or action sheet? What visual hierarchy makes
the privacy implications clearest? Present 2-3 options with trade-offs."
```

```
/react-native-skills
"Review the TrustVault mobile wallet for React Native performance:
1. FlashList with estimatedItemSize for credential list
2. Memoized credential card components
3. Stable callbacks in list items (useCallback)
4. Reanimated shared values for animations (not state)
5. expo-image for any images/logos
6. Keyboard avoiding for any text inputs
7. Safe area handling for all screens
8. Pressable with proper hitSlop for small touch targets"
```

```
/accesslint-refactor apps/mobile/
"Audit the TrustVault mobile wallet for accessibility:
- All credential cards have accessibilityLabel
- QR scanner has text alternative (manual URI entry)
- Consent sheet is focusable and navigable
- Status badges have accessibilityHint (not color-only)
- All touchable elements have minimum 44x44 target
- Screen reader reads credential claims in logical order
- Dynamic type support (text scales with system settings)"
```

**Exit Criteria:**
- [ ] Wallet home shows credential cards from API
- [ ] Credential detail shows all claims with SD indicators
- [ ] QR scanner opens camera and reads QR codes
- [ ] Receive flow: scan → preview → confirm → stored with animation
- [ ] Present flow: scan → select → disclose → consent → result
- [ ] Haptic feedback on receive, consent, verify
- [ ] Accessible (screen reader, dynamic type, touch targets)

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm2): mobile wallet — dashboard, receive, present, consent, qr scanning" && git push origin main
```

---

### FM3: Web Portals (Issuer + Verifier + Trust Admin)

**Objective:** Complete web interfaces for issuers, verifiers, and trust admin.

| # | Task | Skill |
|---|---|---|
| 1 | Issuer dashboard — stats + recent issuances table | `/frontend-design` |
| 2 | Create credential offer flow (schema → claims → QR) | `/frontend-design` |
| 3 | Dynamic claim form (generated from schema) | `/react-best-practices` |
| 4 | Issued credentials table with revoke action | — |
| 5 | Verifier dashboard — stats + recent results | `/frontend-design` |
| 6 | Create verification request flow (types → claims → policies → QR) | `/frontend-design` |
| 7 | Verification result detail with animated pipeline | `/frontend-design` |
| 8 | VerificationPipeline animated component | `/frontend-design` |
| 9 | Verification policies CRUD page | — |
| 10 | Trust admin — issuers table + register form | `/frontend-design` |
| 11 | Schema registry page | — |
| 12 | Connect all pages to backend APIs | `/react-best-practices` |

**Skill Prompts:**

```
/frontend-design
"Build the issuer dashboard for TrustVault web portal. Top row: 3 stat cards (Total
Issued, Active, Revoked) with numbers and mini sparkline trends. Below: recent
issuances table — Credential Type, Subject DID (truncated + copy), Status badge,
Date, Actions (view, revoke). 'Create New Offer' button prominent in header.
shadcn/ui Table + Card. Dark mode. Recharts for sparklines."
```

```
/frontend-design
"Build the 'Create Credential Offer' flow for TrustVault issuer portal. 3-step:
Step 1: Select schema — radio cards (Education, Income, Identity) with type icon,
name, and claim count.
Step 2: Fill claims — dynamic form generated from schema definition. Each field has
a label, type-appropriate input, and an SD indicator (🔒 = always disclosed,
🔓 = selectively disclosable). React Hook Form + Zod validation.
Step 3: QR code display — large QR code, copy URI button, offer expiry countdown
timer. Message: 'Show this QR to the credential holder to scan with their wallet.'
shadcn/ui, Tailwind, dark mode."
```

```
/frontend-design
"Build the verification result detail page for TrustVault verifier portal. This is
the showcase page. Shows:
1. Header: large VERIFIED (green) or REJECTED (red) badge with entrance animation.
2. Verification Pipeline: horizontal flow of 5 nodes (Signature → Expiration →
   Status → Trust → Policy). Each node animates sequentially on page load — starts
   grey, fills green (pass) or red (fail) with connecting line animation. Use
   Framer Motion.
3. Credential Data: cards per credential with disclosed claims and issuer badge.
4. Metadata: verifier DID, nonce, timestamp, policies applied.
shadcn/ui Card + Badge. Dark mode. This should be visually impressive."
```

```
/frontend-design
"Build the trust admin page for TrustVault web portal. Two sections:
1. Trusted Issuers table: Name, DID (truncated), Credential Types (colored badges),
   Status, Registered Date, Actions (edit, remove). Search + filter. 'Register New
   Issuer' button.
2. Register issuer dialog (shadcn/ui Dialog): form with Name, DID input, Description,
   Credential Types (multi-select from available schemas), Website URL.
Dark mode. shadcn/ui Table + Dialog + Badge."
```

```
/react-best-practices
"Review TrustVault web portal API layer for performance:
- Parallel fetches for dashboard (stats + recent activity in Promise.all)
- Dynamic imports for heavy components (QR code, charts)
- Proper Suspense boundaries around data-fetching components
- SWR or unstable_cache for repeated reads (credential list, issuers list)
- No waterfall fetches in dashboard pages"
```

**Exit Criteria:**
- [ ] Issuer dashboard renders with stats and table from API
- [ ] Create offer flow generates QR with valid offer URI
- [ ] Issued credentials table with working revoke button
- [ ] Verifier dashboard renders with stats and results
- [ ] Verification request flow generates QR
- [ ] Result detail page shows animated pipeline
- [ ] Trust admin can list, register, remove issuers
- [ ] All pages connected to backend APIs

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm3): web portals — issuer, verifier, trust admin dashboards and flows" && git push origin main
```

---

### FM4: E2E Cross-Platform Flows

**Objective:** Wire mobile + web together, full demo flows, loading/error/empty states.

| # | Task | Skill |
|---|---|---|
| 1 | Full issuance flow: Web issuer → QR → Phone scans → Credential stored | — |
| 2 | Full verification flow: Web verifier → QR → Phone scans → Consent → Result on web | — |
| 3 | Loan processing E2E: 3 issuers → 3 credentials → verify all 3 | — |
| 4 | Loading states (skeleton screens) for all pages | `/ui-ux-pro-max` |
| 5 | Error states (API failures, network errors) | `/ui-ux-pro-max` |
| 6 | Empty states (no credentials, no results) | — |
| 7 | Toast notifications for all mutations (sonner web, Alert mobile) | — |
| 8 | Responsive testing — web at 768px, 1024px, 1280px | `/ui-ux-pro-max` |
| 9 | Mobile testing — phone sizes 375px, 390px, 414px | `/react-native-skills` |

**Skill Prompts:**

```
/ui-ux-pro-max
"Review the TrustVault frontend (mobile + web) for interaction quality:
Mobile: touch targets min 44x44pt, press feedback on all Pressables, haptic on
key actions, skeleton screens during loading (>300ms), safe area awareness.
Web: loading spinners on async buttons, error messages near fields, empty states
with CTA, skeleton screens, toast on mutations, responsive at 768px+.
Both: consistent status colors, credential type accents, no color-only indicators."
```

**Exit Criteria:**
- [ ] Issuer (web) creates offer → Wallet (phone) scans QR → Credential stored
- [ ] Verifier (web) creates request → Wallet (phone) scans → Consent → Verifier sees result
- [ ] Full loan processing demo works cross-platform
- [ ] Loading/error/empty states on every screen
- [ ] Responsive web, multiple phone sizes tested

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm4): e2e cross-platform flows — web+mobile integration, loading/error states" && git push origin main
```

---

### FM5: Polish — Accessibility, Animations, Compliance

**Objective:** Final quality pass across both platforms.

| # | Task | Skill |
|---|---|---|
| 1 | Full mobile accessibility audit | `/accesslint-refactor` |
| 2 | Full web accessibility audit | `/accesslint-refactor` |
| 3 | Web Interface Guidelines compliance review | `/web-design-guidelines` |
| 4 | Mobile animations polish (Reanimated) | `/frontend-design` |
| 5 | Web page transitions + micro-interactions (Framer Motion) | `/frontend-design` |
| 6 | Verification pipeline sequential animation | `/frontend-design` |
| 7 | Pre-delivery UI checklist (both platforms) | `/ui-ux-pro-max` |
| 8 | Playwright visual testing (web) | `mcp__playwright__*` |
| 9 | Final responsive pass | — |

**Skill Prompts:**

```
/accesslint-refactor apps/mobile/ apps/web/src/
"Full WCAG 2.1 AA audit of TrustVault — both mobile wallet (React Native) and web
portals (Next.js). Mobile focus: accessibilityLabel, accessibilityHint, touch targets,
dynamic type, screen reader order. Web focus: focus rings, heading hierarchy, form
labels, keyboard navigation, color contrast in dark mode, ARIA on dialogs."
```

```
/web-design-guidelines apps/web/src/
"Review TrustVault web portals against Web Interface Guidelines. Check all pages
for compliance. Report findings with file:line notation."
```

```
/frontend-design
"Add polish animations to TrustVault:
Mobile: credential card entrance animation (slide up + fade, staggered), receive
success checkmark (path draw + scale), consent sheet slide up with spring physics,
present result confetti/checkmark.
Web: page transitions (slide + fade via AnimatePresence), credential cards stagger,
verification pipeline sequential node animation, stat card counter animation,
QR code subtle pulse while waiting.
All animations must respect prefers-reduced-motion (web) and Reduce Motion (mobile)."
```

```
/ui-ux-pro-max
"Run pre-delivery checklist on TrustVault (both platforms):
Visual: icons consistent (Phosphor)? semantic tokens? credential type accents correct?
Interaction: touch targets 44px? pressed feedback? loading states? disabled states?
Dark Mode: contrast >=4.5:1? borders visible?
Layout: safe areas (mobile)? responsive (web)? scroll not hidden behind bars?
Accessibility: labels? hints? color not only? reduced motion? dynamic type (mobile)?
Forms: visible labels? error near field? required indicators?"
```

**Playwright MCP Testing (Web):**
```
mcp__playwright__browser_navigate → load each web portal page
mcp__playwright__browser_resize → test at 768px, 1024px, 1280px
mcp__playwright__browser_snapshot → verify DOM structure and a11y
mcp__playwright__browser_take_screenshot → capture all key pages
mcp__playwright__browser_click → verify all interactive elements
```

**Exit Criteria:**
- [ ] Zero WCAG 2.1 AA violations (critical/high) on both platforms
- [ ] Web Interface Guidelines compliance passed
- [ ] Smooth animations on both platforms
- [ ] All animations respect reduced motion
- [ ] Mobile tested on 375px, 390px, 414px
- [ ] Web tested on 768px, 1024px, 1280px
- [ ] Pre-delivery checklist all green
- [ ] Playwright screenshots captured

**Commit & Push:**
```bash
git add -A && git commit -m "feat(fm5): polish — accessibility, animations, responsive, compliance" && git push origin main
```

---

## 7. API Integration Map

| Screen | Platform | Backend Endpoint | Method |
|---|---|---|---|
| **Wallet Home** | Mobile | `/wallet/credentials?holderId=xxx` | GET |
| **Credential Detail** | Mobile | `/wallet/credentials/:id` | GET |
| **Credential Claims** | Mobile | `/wallet/credentials/:id/claims` | GET |
| **Receive Credential** | Mobile | `/wallet/credentials/receive` | POST |
| **Present Credential** | Mobile | `/wallet/presentations/create` | POST |
| **Consent History** | Mobile | `/wallet/consent/history?holderId=xxx` | GET |
| **Delete Credential** | Mobile | `/wallet/credentials/:id` | DELETE |
| **Issuer Dashboard** | Web | `/issuer/credentials` + `/issuer/schemas` | GET |
| **Create Offer** | Web | `/issuer/offers` | POST |
| **Revoke Credential** | Web | `/issuer/credentials/:id/revoke` | POST |
| **List Schemas** | Web | `/issuer/schemas` | GET |
| **Verifier Dashboard** | Web | `/verifier/presentations` (list) | GET |
| **Create Request** | Web | `/verifier/presentations/request` | POST |
| **View Result** | Web | `/verifier/presentations/:id` | GET |
| **List Policies** | Web | `/verifier/policies` | GET |
| **Create Policy** | Web | `/verifier/policies` | POST |
| **List Issuers** | Web | `/trust/issuers` | GET |
| **Register Issuer** | Web | `/trust/issuers` | POST |
| **Remove Issuer** | Web | `/trust/issuers/:did` | DELETE |

---

## 8. Manual TODOs

### Before Starting

- [ ] Backend API running (milestones M1-M5 complete)
- [ ] Install Expo Go app on your phone (iOS App Store / Google Play — free)
- [ ] Confirm backend API base URL (default: `http://localhost:3000`)
- [ ] For phone to reach localhost: use `ngrok` (free) or same WiFi + local IP

### Design Decisions (Finalize with Skills)

- [ ] Run `/ui-ux-pro-max` for color palette finalization
- [ ] Run `/ui-ux-pro-max` for typography finalization
- [ ] Run `/bencium-controlled-ux-designer` to review consent sheet design

### After Development

- [ ] Run `/accesslint-refactor` for full accessibility audit (both platforms)
- [ ] Run `/web-design-guidelines` for web compliance review
- [ ] Capture Playwright screenshots at all breakpoints
- [ ] Test full cross-platform E2E: web issuer → phone wallet → web verifier
- [ ] Record screen capture of the demo flow for presentation

---

## 9. Dependency on Backend

```
Backend Milestones          Frontend Milestones

M1: Foundation    ─────────► FM1: Can start (no API needed, use mock data)
M2: Issuer        ─────────► FM3: Wire issuer portal to real APIs
M3: Wallet+Status ─────────► FM2: Wire mobile wallet to real APIs
M4: Verifier+Trust─────────► FM3: Wire verifier/trust to real APIs
M5: E2E           ─────────► FM4: Full cross-platform E2E
M6: Demo Ready    ─────────► FM5: Polish + final testing
```

**FM1 can start immediately** — no backend dependency.
**FM2 and FM3 can use mock data** until backend milestones complete.

---

## 10. Definition of Done (Frontend)

### Mobile Wallet
- [ ] Credential cards list with type-specific styling
- [ ] Credential detail with SD claim indicators
- [ ] QR scanner (camera) working
- [ ] Receive flow: scan → preview → confirm → stored + haptic
- [ ] Present flow: scan → select → disclose → consent → result + haptic
- [ ] Consent bottom sheet with clear disclosure breakdown
- [ ] Consent history
- [ ] Accessible (VoiceOver/TalkBack, dynamic type, 44px targets)

### Web Portals
- [ ] Issuer: dashboard, create offer (QR), credentials table, revoke
- [ ] Verifier: dashboard, create request (QR), results, animated pipeline
- [ ] Trust Admin: issuers table, register, remove
- [ ] Landing page with portal links
- [ ] Responsive (768px+)
- [ ] WCAG 2.1 AA compliant

### Cross-Platform
- [ ] QR flow works: web shows QR → phone scans → action completes
- [ ] Full loan processing demo: 3 issuers → 3 credentials → verify all 3
- [ ] Total cost: **$0**

---

*Document Version: 2.0 | Updated: 2026-03-30 | Mobile: Expo + React Native | Web: Next.js + shadcn/ui*
