# TrustVault Mobile — Build Guide

## Prerequisites

| Requirement | Command to verify | Notes |
|-------------|-------------------|-------|
| Node.js 20+ | `node --version` | |
| pnpm | `pnpm --version` | |
| EAS CLI | `eas --version` | Install: `npm install -g eas-cli` |
| Expo account | `eas whoami` | Create free at [expo.dev](https://expo.dev) |
| Apple Developer account | — | iOS builds only ($99/year) |

## Login

```bash
eas login
```

Required for all EAS builds (cloud and local).

---

## Build Profiles

| Profile | Purpose | Output | Install method |
|---------|---------|--------|----------------|
| `development` | Dev/debug with hot reload | APK / Simulator build | Sideload / Xcode |
| `preview` | Internal testing, demo | APK / IPA | Sideload / TestFlight |
| `production` | Store release | AAB / IPA | Play Store / App Store |

---

## Environment Variables

### Development (Expo Go / dev client)

The phone must reach the API server running on your computer. Set your LAN IP in `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

To find your IP:

```bash
# Windows
ipconfig
# Look for WiFi adapter → IPv4 Address (e.g. 192.168.0.145)

# macOS/Linux
ifconfig | grep "inet "
```

When you switch WiFi networks, your IP may change. Update `.env` and restart Metro.

The API server must also be running and listening on `0.0.0.0` (not just localhost). This is already configured in `apps/api/src/main.ts`.

### EAS Builds (preview / production)

Set the API URL as an EAS secret. This is not committed to the repository:

```bash
cd apps/mobile
eas secret:create --name EXPO_PUBLIC_API_URL --value https://your-api-server.com
```

EAS injects secrets as environment variables during the build. The value is baked into the APK/IPA.

To verify or update secrets:

```bash
eas secret:list
eas secret:delete --name EXPO_PUBLIC_API_URL
```

---

## Cloud Builds (Recommended)

All commands run from `apps/mobile/` or monorepo root.

### Preview APK (Android)

```bash
# From monorepo root
pnpm build:mobile:preview

# Or from apps/mobile
cd apps/mobile
eas build --profile preview --platform android
```

Download the APK link from the terminal output. Transfer to phone and install.

### Preview IPA (iOS)

```bash
cd apps/mobile
eas build --profile preview --platform ios
```

Install via TestFlight:
1. Run `eas submit --platform ios` after build completes
2. Add testers in App Store Connect
3. Testers install via TestFlight app

### Development Build

Custom dev client with all native modules. Connects to Metro for hot reload.

```bash
# Android
pnpm build:mobile:dev

# iOS (simulator)
cd apps/mobile && eas build --profile development --platform ios

# iOS (physical device — register first with eas device:create)
cd apps/mobile && eas build --profile development --platform ios --device
```

### Production Build

```bash
# Android AAB (Play Store)
pnpm build:mobile:prod

# iOS IPA (App Store)
cd apps/mobile && eas build --profile production --platform ios
```

Submit to stores:

```bash
eas submit --platform android   # Play Store
eas submit --platform ios        # App Store
```

---

## Local Builds

Local builds run the EAS pipeline on your machine. No queue wait, no cloud.

**Supported on macOS and Linux only.** Windows users can use WSL (see below).

```bash
cd apps/mobile

# Android APK
eas build --profile preview --platform android --local

# iOS IPA
eas build --profile preview --platform ios --local
```

### Local Builds on Windows (via WSL)

1. Install WSL (Admin PowerShell, one-time):

   ```powershell
   wsl --install
   ```

2. Restart PC. Open Ubuntu from Start menu.

3. Run the setup script:

   ```bash
   bash /mnt/c/Users/001ch/OneDrive/Desktop/projects/sandhya/scripts/wsl-setup.sh
   ```

4. Build:

   ```bash
   cd /mnt/c/Users/001ch/OneDrive/Desktop/projects/sandhya/apps/mobile
   eas login
   eas build --profile preview --platform android --local
   ```

---

## Quick Reference

```bash
# Cloud builds
pnpm build:mobile:dev             # Android dev client APK
pnpm build:mobile:preview         # Android preview APK
pnpm build:mobile:prod            # Android production AAB

# iOS (from apps/mobile)
eas build --profile preview --platform ios
eas build --profile production --platform ios

# Local builds (macOS/Linux/WSL)
eas build --profile preview --platform android --local
eas build --profile preview --platform ios --local

# Store submission
eas submit --platform android
eas submit --platform ios

# Set API URL for builds
eas secret:create --name EXPO_PUBLIC_API_URL --value https://your-api.com
```

---

## Troubleshooting

### "Expo account not found"

```bash
eas login
```

### API URL is wrong in the build

Set it as an EAS secret:

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value https://your-api.com
```

Then rebuild.

### "No development build for this device" (iOS)

Register your device, then rebuild:

```bash
eas device:create
eas build --profile development --platform ios --device
```

### Build fails with native module error

Clean and regenerate:

```bash
cd apps/mobile
npx expo prebuild --clean --platform android
```

### iOS build requires provisioning profile

```bash
eas credentials --platform ios
```

EAS manages certificates automatically with an Apple Developer account.

---

*Updated: 2026-04-01 | Expo SDK 55 | EAS CLI 15+*
