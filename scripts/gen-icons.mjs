import sharp from 'sharp';

// TrustiLock — Minimal, subtle, elegant
// Just a clean shield outline with a tiny keyhole. Nothing else.
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0C1220"/>
      <stop offset="100%" stop-color="#0A0F1A"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" rx="224" fill="url(#bg)"/>

  <!-- Single shield outline — thin, refined stroke -->
  <path
    d="M512 185 C512 185 330 240 250 275 C250 275 228 530 512 710 C796 530 774 275 774 275 C694 240 512 185 512 185Z"
    fill="none"
    stroke="#3CEAAA"
    stroke-width="5"
    stroke-linejoin="round"
    opacity="0.9"
  />

  <!-- Tiny lock shackle — delicate -->
  <path
    d="M484 440 L484 405 C484 375 495 355 512 355 C529 355 540 375 540 405 L540 440"
    fill="none"
    stroke="#3CEAAA"
    stroke-width="5"
    stroke-linecap="round"
    opacity="0.85"
  />

  <!-- Small lock body — just a rounded rect outline -->
  <rect
    x="472" y="435" width="80" height="65" rx="14"
    fill="none"
    stroke="#3CEAAA"
    stroke-width="5"
    opacity="0.85"
  />

  <!-- Keyhole — a small circle + slot -->
  <circle cx="512" cy="460" r="8" fill="#3CEAAA" opacity="0.7"/>
  <rect x="509" y="463" width="6" height="16" rx="3" fill="#3CEAAA" opacity="0.7"/>
</svg>`;

// Adaptive foreground — same but no bg
const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <path
    d="M512 185 C512 185 330 240 250 275 C250 275 228 530 512 710 C796 530 774 275 774 275 C694 240 512 185 512 185Z"
    fill="none" stroke="#3CEAAA" stroke-width="5" stroke-linejoin="round" opacity="0.9"/>
  <path
    d="M484 440 L484 405 C484 375 495 355 512 355 C529 355 540 375 540 405 L540 440"
    fill="none" stroke="#3CEAAA" stroke-width="5" stroke-linecap="round" opacity="0.85"/>
  <rect x="472" y="435" width="80" height="65" rx="14"
    fill="none" stroke="#3CEAAA" stroke-width="5" opacity="0.85"/>
  <circle cx="512" cy="460" r="8" fill="#3CEAAA" opacity="0.7"/>
  <rect x="509" y="463" width="6" height="16" rx="3" fill="#3CEAAA" opacity="0.7"/>
</svg>`;

async function generate() {
  await sharp(Buffer.from(svg)).resize(1024, 1024).png().toFile('apps/mobile/assets/icon.png');
  console.log('icon.png');
  await sharp(Buffer.from(svg)).resize(32, 32).png().toFile('apps/web/src/app/favicon.ico');
  console.log('favicon.ico');
  await sharp(Buffer.from(svg)).resize(192, 192).png().toFile('apps/web/public/icon-192.png');
  console.log('icon-192.png');
  await sharp(Buffer.from(svg)).resize(512, 512).png().toFile('apps/web/public/icon-512.png');
  console.log('icon-512.png');
  await sharp(Buffer.from(fgSvg)).resize(1024, 1024).png().toFile('apps/mobile/assets/adaptive-icon.png');
  console.log('adaptive-icon.png');
  await sharp(Buffer.from(svg)).resize(288, 288).png().toFile('apps/mobile/assets/splash-icon.png');
  console.log('splash-icon.png');
}

generate().catch(console.error);
