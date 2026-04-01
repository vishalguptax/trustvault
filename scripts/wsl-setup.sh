#!/bin/bash
# =============================================================================
# WSL Setup Script for TrustVault Mobile Local Builds
# =============================================================================
#
# Prerequisites:
#   1. Install WSL: open Admin PowerShell and run: wsl --install
#   2. Restart your PC
#   3. Open Ubuntu from Start menu, set username/password
#   4. Run this script: bash /mnt/c/Users/001ch/OneDrive/Desktop/projects/sandhya/scripts/wsl-setup.sh
#
# After setup, build APK with:
#   cd /mnt/c/Users/001ch/OneDrive/Desktop/projects/sandhya/apps/mobile
#   eas build --profile preview --platform android --local
# =============================================================================

set -e

echo ""
echo "=== TrustVault WSL Build Environment Setup ==="
echo ""

# Node.js 20 LTS
echo "[1/6] Installing Node.js 20..."
if command -v node &>/dev/null && [[ "$(node --version)" == v20* ]]; then
  echo "  Node.js $(node --version) already installed"
else
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt install -y nodejs
  echo "  Installed Node.js $(node --version)"
fi

# pnpm
echo ""
echo "[2/6] Installing pnpm..."
if command -v pnpm &>/dev/null; then
  echo "  pnpm $(pnpm --version) already installed"
else
  sudo npm install -g pnpm
  echo "  Installed pnpm $(pnpm --version)"
fi

# EAS CLI
echo ""
echo "[3/6] Installing EAS CLI..."
if command -v eas &>/dev/null; then
  echo "  EAS CLI $(eas --version) already installed"
else
  sudo npm install -g eas-cli
  echo "  Installed EAS CLI $(eas --version)"
fi

# Java 17
echo ""
echo "[4/6] Installing Java 17..."
if java --version 2>&1 | grep -q "17"; then
  echo "  Java 17 already installed"
else
  sudo apt update -y
  sudo apt install -y openjdk-17-jdk
  echo "  Installed Java $(java --version 2>&1 | head -1)"
fi

# Android SDK + NDK
echo ""
echo "[5/6] Installing Android SDK + NDK..."
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

if [ -d "$ANDROID_HOME/cmdline-tools/latest" ]; then
  echo "  Android SDK already installed at $ANDROID_HOME"
else
  mkdir -p "$ANDROID_HOME"
  cd /tmp

  echo "  Downloading Android command-line tools..."
  curl -fsSL -o cmdline-tools.zip https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
  unzip -q -o cmdline-tools.zip
  mkdir -p "$ANDROID_HOME/cmdline-tools"
  rm -rf "$ANDROID_HOME/cmdline-tools/latest"
  mv cmdline-tools "$ANDROID_HOME/cmdline-tools/latest"
  rm cmdline-tools.zip

  echo "  Accepting licenses..."
  yes | "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" --licenses > /dev/null 2>&1 || true

  echo "  Installing platform-tools, build-tools, platform, NDK..."
  "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" \
    "platform-tools" \
    "build-tools;36.0.0" \
    "platforms;android-36" \
    "ndk;27.1.12297006" \
    --channel=0

  echo "  Android SDK installed at $ANDROID_HOME"
fi

# Shell profile
echo ""
echo "[6/6] Configuring shell profile..."
PROFILE="$HOME/.bashrc"
if ! grep -q "ANDROID_HOME" "$PROFILE" 2>/dev/null; then
  cat >> "$PROFILE" << 'ENVBLOCK'

# Android SDK (added by TrustVault setup)
export ANDROID_HOME="$HOME/android-sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
ENVBLOCK
  echo "  Added ANDROID_HOME to $PROFILE"
else
  echo "  ANDROID_HOME already in $PROFILE"
fi

# EAS login check
echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Restart WSL:  exit, then open Ubuntu again"
echo "  2. Login to EAS: eas login"
echo "  3. Build APK:"
echo "     cd /mnt/c/Users/001ch/OneDrive/Desktop/projects/sandhya/apps/mobile"
echo "     eas build --profile preview --platform android --local"
echo ""
echo "The APK will be saved in the current directory."
echo ""
