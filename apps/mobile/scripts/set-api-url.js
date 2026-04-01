#!/usr/bin/env node
/**
 * Sets EXPO_PUBLIC_API_URL in .env and optionally as an EAS secret.
 *
 * Usage:
 *   node scripts/set-api-url.js           # auto-detect LAN IP
 *   node scripts/set-api-url.js 10.0.0.5  # use specific IP
 *   node scripts/set-api-url.js --eas     # also set as EAS secret
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const args = process.argv.slice(2);
const setEas = args.includes('--eas');
const manualIp = args.find((a) => !a.startsWith('--'));

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

const ip = manualIp || getLanIp();
if (!ip) {
  console.error('Could not detect LAN IP. Pass it manually: node scripts/set-api-url.js 192.168.x.x');
  process.exit(1);
}

const url = `http://${ip}:8000`;
const envPath = path.resolve(__dirname, '..', '.env');

fs.writeFileSync(envPath, `EXPO_PUBLIC_API_URL=${url}\n`);
console.log(`.env updated: ${url}`);

if (setEas) {
  try {
    execSync(`eas secret:create --name EXPO_PUBLIC_API_URL --value "${url}" --force`, {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
    console.log(`EAS secret updated: ${url}`);
  } catch {
    console.error('Failed to set EAS secret. Run "eas login" first.');
  }
}
