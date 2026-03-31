# TrustVault Mobile — Build Guide

## Prerequisites

| Requirement | Command to verify | Notes |
|-------------|-------------------|-------|
| Node.js 20+ | `node --version` | |
| pnpm | `pnpm --version` | |
| EAS CLI | `eas --version` | Install: `npm install -g eas-cli` |
| Expo account | `eas whoami` | Create free at [expo.dev](https://expo.dev) |
| Apple Developer account | — | Required for iOS builds ($99/year) |
| Android — no account needed for APK | — | Play Store requires Google Play Console ($25 one-time) |

## Login

```bash
eas login
```

Enter your Expo account credentials. This is required for all EAS builds.

---

## Build Profiles

| Profile | Purpose | Output | Metro needed? | Install method |
|---------|---------|--------|---------------|----------------|
| `development` | Dev/debug with hot reload | APK (Android) / Simulator (iOS) | Yes | Sideload APK / Xcode |
| `preview` | Internal testing, demo | APK (Android) / IPA via TestFlight | No | Sideload APK / TestFlight |
| `production` | Store release | AAB (Android) / IPA (iOS) | No | Play Store / App Store |
| `local` | Build on your machine | APK or IPA | No | Manual |

---

## Option 1: Development Build

Custom dev client — replaces Expo Go with your own app that includes all native modules. Connects to Metro for hot reload.

### Android

```bash
# From monorepo root
pnpm build:mobile:dev

# Or from apps/mobile
cd apps/mobile
eas build --profile development --platform android
```

**Output:** APK file (~50MB)
**Install:** Download the APK link from the terminal, install on your phone.
**Usage:** Start Metro (`pnpm dev:mobile`), open the dev client app, it connects automatically.

### iOS

```bash
cd apps/mobile

# For simulator
eas build --profile development --platform ios

# For physical device (requires Apple Developer account)
eas build --profile development --platform ios --device
```

**Output:** `.app` (simulator) or IPA (device)
**Install:**
- Simulator: `eas build:run` after build completes
- Device: Register your device first with `eas device:create`, then build

---

## Option 2: Preview Build (Recommended for testing)

Standalone app with JS bundle embedded. No Metro server needed. Works offline.

### Android

```bash
# From monorepo root
pnpm build:mobile:preview

# Or from apps/mobile
cd apps/mobile
eas build --profile preview --platform android
```

**Output:** APK file (~30MB)
**Install:** Download APK link from terminal → transfer to phone → install.
**Important:** The `EXPO_PUBLIC_API_URL` is baked in at build time. Update it in `apps/mobile/eas.json` before building:

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://your-api-server.com"
      }
    }
  }
}
```

For local network testing, use your LAN IP (e.g., `http://192.168.0.145:8000`).

### iOS

```bash
cd apps/mobile

# Internal distribution (no App Store review)
eas build --profile preview --platform ios
```

**Output:** IPA file
**Install:** Via TestFlight (requires Apple Developer account) or ad-hoc distribution.

**For TestFlight:**
1. Build completes → EAS gives you a link
2. Run `eas submit --platform ios` to upload to App Store Connect
3. Add testers in TestFlight
4. Testers install via TestFlight app

**For ad-hoc (no TestFlight):**
1. Register test devices first: `eas device:create`
2. Add provisioning profile: `eas credentials`
3. Build with `--distribution internal`

---

## Option 3: Production Build

For Play Store / App Store submission.

### Android

```bash
# From monorepo root
pnpm build:mobile:prod

# Or from apps/mobile
cd apps/mobile
eas build --profile production --platform android
```

**Output:** AAB (Android App Bundle) — required by Play Store
**Submit to Play Store:**
```bash
eas submit --platform android
```
Requires a Google Play Console account and service account key. See [EAS Submit docs](https://docs.expo.dev/submit/android/).

### iOS

```bash
cd apps/mobile
eas build --profile production --platform ios
```

**Output:** IPA file
**Submit to App Store:**
```bash
eas submit --platform ios
```
Requires Apple Developer account with App Store Connect API key.

---

## Option 4: Local Build (No EAS account)

Build on your machine. Requires native toolchains installed.

### Android (requires Java 17 + Android SDK)

```bash
cd apps/mobile

# Generate native android/ directory
npx expo prebuild --platform android

# Build release APK
cd android
./gradlew assembleRelease
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

**Prerequisites:**
- Java 17: `java --version`
- Android SDK: Set `ANDROID_HOME` environment variable
- Accept licenses: `sdkmanager --licenses`

### iOS (requires macOS + Xcode)

```bash
cd apps/mobile

# Generate native ios/ directory
npx expo prebuild --platform ios

# Open in Xcode
open ios/TrustVaultWallet.xcworkspace

# Or build from command line
cd ios
pod install
xcodebuild -workspace TrustVaultWallet.xcworkspace -scheme TrustVaultWallet -configuration Release -sdk iphoneos archive
```

**Prerequisites:**
- macOS only
- Xcode 15+: `xcode-select --version`
- CocoaPods: `pod --version` (install: `sudo gem install cocoapods`)
- Apple Developer certificate and provisioning profile

---

## Environment Variables

| Variable | Where to set | Purpose |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | `apps/mobile/.env` (dev) or `eas.json` (builds) | Backend API base URL |
| `EXPO_NO_METRO_WORKSPACE_ROOT` | `apps/mobile/.env` | Fix for pnpm monorepo Metro resolution |

### For development (Expo Go / dev client):
```bash
# apps/mobile/.env
EXPO_PUBLIC_API_URL=http://192.168.0.145:8000
```

### For preview/production builds:
Set in `apps/mobile/eas.json` under each profile's `env` block. These are baked into the APK/IPA at build time.

---

## Quick Reference

```bash
# Development (hot reload, connects to Metro)
pnpm build:mobile:dev           # Android APK
cd apps/mobile && eas build --profile development --platform ios  # iOS

# Preview (standalone APK/IPA for testing)
pnpm build:mobile:preview       # Android APK
cd apps/mobile && eas build --profile preview --platform ios      # iOS

# Production (store submission)
pnpm build:mobile:prod           # Android AAB
cd apps/mobile && eas build --profile production --platform ios   # iOS

# Local build (no EAS)
cd apps/mobile && pnpm build:local   # Android APK (requires Android SDK)

# Submit to stores
cd apps/mobile && eas submit --platform android   # Play Store
cd apps/mobile && eas submit --platform ios        # App Store
```

---

## Troubleshooting

### "Expo account not found"
```bash
eas login
```

### "No development build for this device"
Register your device:
```bash
eas device:create
```
Then rebuild with `--device` flag.

### "EXPO_PUBLIC_API_URL is localhost in the build"
Update the URL in `eas.json` under the correct profile's `env` block. Rebuild after changing.

### "Build fails with native module error"
Run prebuild to regenerate native directories:
```bash
cd apps/mobile
npx expo prebuild --clean --platform android
```

### "iOS build requires provisioning profile"
Set up credentials:
```bash
eas credentials --platform ios
```
EAS can manage certificates automatically if you have an Apple Developer account.

---

*Document Version: 1.0 | Updated: 2026-04-01 | Expo SDK 55 | EAS CLI 15+*
