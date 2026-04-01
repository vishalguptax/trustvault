#!/usr/bin/env node
/**
 * Sets EXPO_PUBLIC_API_URL in .env and optionally as an EAS env variable.
 *
 * Usage:
 *   node scripts/set-api-url.js                          # auto-detect LAN IP, port 8000
 *   node scripts/set-api-url.js 10.0.0.5                 # specific IP, port 8000
 *   node scripts/set-api-url.js https://api.example.com  # full URL
 *   node scripts/set-api-url.js --eas                    # also set as EAS env variable
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const setEas = args.includes('--eas');
const input = args.find((a) => !a.startsWith('--'));

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

function resolveUrl(value) {
  if (!value) {
    const ip = getLanIp();
    if (!ip) {
      console.error('Could not detect LAN IP. Pass an IP or URL manually.');
      process.exit(1);
    }
    return `http://${ip}:8000`;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return `http://${value}:8000`;
}

const url = resolveUrl(input);
const envPath = path.resolve(__dirname, '..', '.env');

fs.writeFileSync(envPath, `EXPO_PUBLIC_API_URL=${url}\n`);
console.log(`.env → ${url}`);

if (setEas) {
  try {
    execSync(`eas env:create --name EXPO_PUBLIC_API_URL --value "${url}" --visibility plaintext --environment preview --force`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log(`EAS  → ${url}`);
  } catch {
    console.error('Failed to set EAS env. Run "eas login" first.');
  }
}
