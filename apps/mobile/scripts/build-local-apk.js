#!/usr/bin/env node
/**
 * Local APK build script for Windows.
 *
 * Fixes two issues:
 * 1. Sets EXPO_NO_METRO_WORKSPACE_ROOT=1 so Metro resolves from apps/mobile/
 * 2. Fixes expo-constants symlink (pnpm hoisting puts wrong version locally)
 * 3. Cleans stale native build caches from node_modules
 *
 * Prerequisites:
 * - Enable Windows long paths (run as Admin):
 *   New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
 * - Java 17, Android SDK with NDK 27.1.12297006
 *
 * Usage: node scripts/build-local-apk.js
 * Output: android/app/build/outputs/apk/release/app-release.apk
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectDir = path.resolve(__dirname, '..');
const monorepoRoot = path.resolve(projectDir, '../..');
const androidDir = path.join(projectDir, 'android');

const env = {
  ...process.env,
  EXPO_NO_METRO_WORKSPACE_ROOT: '1',
};

function run(cmd, cwd = projectDir) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { cwd, stdio: 'inherit', env });
}

try {
  // Step 1: Prebuild
  run('npx expo prebuild --platform android');

  // Step 2: Fix expo-constants — pnpm may install wrong version in local node_modules
  const localConstants = path.join(projectDir, 'node_modules/expo-constants');
  const rootConstants = path.join(monorepoRoot, 'node_modules/expo-constants');
  if (fs.existsSync(localConstants) && fs.existsSync(rootConstants)) {
    const localVer = JSON.parse(fs.readFileSync(path.join(localConstants, 'package.json'), 'utf8')).version;
    const rootVer = JSON.parse(fs.readFileSync(path.join(rootConstants, 'package.json'), 'utf8')).version;
    if (localVer !== rootVer) {
      console.log(`\nFixing expo-constants: local=${localVer} root=${rootVer}`);
      fs.rmSync(localConstants, { recursive: true, force: true });
      // Copy instead of symlink (Windows symlinks need admin)
      execSync(`xcopy "${rootConstants}" "${localConstants}" /E /I /Q /Y`, { stdio: 'pipe' });
      console.log(`Replaced with ${rootVer}`);
    }
  }

  // Step 3: Clean stale native build caches
  const cacheGlobs = ['expo-modules-core', 'expo-constants', 'expo'];
  for (const pkg of cacheGlobs) {
    const buildDir = path.join(monorepoRoot, `node_modules/${pkg}/android/build`);
    if (fs.existsSync(buildDir)) {
      console.log(`Cleaning: ${buildDir}`);
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
  }

  // Step 4: Build release APK
  const isWin = process.platform === 'win32';
  const gradlew = path.join(androidDir, isWin ? 'gradlew.bat' : 'gradlew');
  run(`"${gradlew}" assembleRelease`, androidDir);

  // Step 5: Report
  const apkPath = path.join(androidDir, 'app/build/outputs/apk/release/app-release.apk');
  if (fs.existsSync(apkPath)) {
    const sizeMB = (fs.statSync(apkPath).size / (1024 * 1024)).toFixed(1);
    console.log(`\nAPK built successfully (${sizeMB} MB): ${apkPath}`);
  } else {
    console.log('\nBuild completed. Check android/app/build/outputs/apk/release/');
  }
} catch (err) {
  console.error('\nBuild failed:', err.message);
  process.exit(1);
}
