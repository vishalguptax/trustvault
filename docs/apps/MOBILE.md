# @trustilock/mobile

Expo React Native mobile wallet for receiving, storing, and presenting Verifiable Credentials.

## Setup

```bash
# From repo root
pnpm install

# Set API URL to your machine's LAN IP (auto-detect)
pnpm --filter @trustilock/mobile set-api-url

# Start Expo dev server (port 5000)
pnpm dev:mobile
```

Scan the QR code with Expo Go on your phone. The API must be running and reachable from your phone (same WiFi network).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Expo dev server on port 5000 (LAN mode) |
| `pnpm set-api-url` | Auto-detect LAN IP and write to `.env` |
| `pnpm set-api-url <ip>` | Set a specific IP |
| `pnpm set-api-url <url>` | Set a full URL (e.g., production) |
| `pnpm set-api-url --eas` | Also set as EAS environment variable |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | Run Expo linter |
| `pnpm prebuild` | Generate native projects (Android/iOS) |
| `pnpm android` | Run on Android device/emulator |
| `pnpm ios` | Run on iOS simulator |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000` | Backend API URL reachable from the phone |

**Important:** This value is baked into the JS bundle at build time. You cannot change it after building without a new build or an OTA update.

### Setting the API URL

For local development, your phone needs to reach the API over your local network. Use your machine's LAN IP, not `localhost`.

```bash
# Auto-detect (recommended)
pnpm set-api-url

# Specific IP
pnpm set-api-url 192.168.1.42

# Production URL
pnpm set-api-url https://trustilock-api.onrender.com
```

Find your LAN IP manually: run `ipconfig` (Windows) or `ifconfig` (Mac/Linux) and look for the WiFi adapter IPv4 address. Update when you switch networks.

## Building with EAS

### Build Profiles

| Profile | Purpose | Output | Command |
|---------|---------|--------|---------|
| `development` | Dev client with debug tools | APK (Android), Simulator (iOS) | `pnpm build:dev` |
| `preview` | Internal testing | APK (Android) | `pnpm build:preview` |
| `production` | App store release | AAB (Android) | `pnpm build:prod` |

### Production Build with API URL

The production API URL is configured in `eas.json` under `build.production.env`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-api.example.com"
      }
    }
  }
}
```

To build:

```bash
# Android production bundle
pnpm build:prod

# iOS production
pnpm build:prod:ios
```

Or override inline:

```bash
EXPO_PUBLIC_API_URL=https://your-api.example.com eas build --profile production --platform android
```

### Local Builds (no EAS cloud)

Requires Android SDK. See `scripts/wsl-setup.sh` for WSL setup on Windows.

```bash
pnpm build:local        # Android APK via local build
pnpm build:local:ios    # iOS via local build
```

## App Features

### Authentication
- Login and registration
- MPIN setup for quick unlock
- Biometric authentication (Face ID / fingerprint)
- Lock screen with auto-lock

### Wallet (Home)
- Credential dashboard with category grouping
- Credential detail view with all claims
- Status indicators (active, revoked, suspended, expired)

### QR Scanner
- Scan OID4VCI credential offers to receive credentials
- Scan OID4VP verification requests to present credentials
- Supports `openid-credential-offer://` and `openid4vp://` URI schemes

### Receive Flow
- Scan issuer QR code
- Review credential offer details
- Accept and store credential securely

### Present Flow
- Scan verifier QR code
- Review requested claims
- Selective disclosure consent screen
- Submit verifiable presentation

### History
- Log of all receive and present operations

### Profile
- Account details
- Change MPIN
- Logout

## Tech Stack

- **Expo 55** with Expo Router (file-based routing)
- **React Native 0.83** with React 19
- **Axios** for API calls with interceptors (auto-auth, token refresh)
- **Zustand** for state management
- **Expo Secure Store** for credential storage
- **Expo Camera** for QR scanning
- **Expo Local Authentication** for biometrics
- **React Native Reanimated** for animations
- **React Query** for server state

## API Client

All API calls go through `lib/api.ts` which provides:

- Axios instance with base URL from `EXPO_PUBLIC_API_URL`
- Request interceptor: attaches auth token, logs requests
- Response interceptor: unwraps `{ data }` wrapper, auto-refreshes on 401
- Exported as `api.get()`, `api.post()`, `api.put()`, `api.delete()`

API endpoints are centralized in `lib/routes.ts` — no hardcoded paths in components.

## Project Structure

```
app/
├── _layout.tsx             Root layout (providers, auth gate)
├── (auth)/
│   ├── _layout.tsx         Auth stack layout
│   ├── login.tsx           Login screen
│   ├── register.tsx        Registration screen
│   ├── setup-mpin.tsx      MPIN setup
│   └── lock.tsx            Lock screen
└── (tabs)/
    ├── _layout.tsx         Tab bar layout
    ├── index.tsx           Home / dashboard
    ├── scanner.tsx         QR code scanner
    ├── credentials.tsx     Credential list
    ├── credential/         Credential detail (dynamic route)
    ├── receive.tsx         Receive credential flow
    ├── present.tsx         Present credential flow
    ├── history.tsx         Activity history
    └── profile.tsx         User profile

components/                 Reusable React Native components
hooks/                      Custom React hooks

lib/
├── api.ts                  Axios client with auth interceptors
├── auth/                   Auth context and secure storage
├── constants.ts            API_BASE_URL (single source)
├── routes.ts               All navigation routes and API endpoints
├── store.ts                Zustand stores
├── query-client.ts         React Query client
├── format.ts               Formatting utilities
├── haptics.ts              Haptic feedback helpers
└── theme.tsx               Color theme definitions

scripts/
└── set-api-url.js          LAN IP auto-detection utility

assets/                     Images and icons
```
