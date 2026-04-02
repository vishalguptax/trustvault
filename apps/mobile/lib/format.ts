/**
 * Formatting utilities for the mobile app.
 * Dates, DIDs, claim values — all formatting logic lives here.
 */

// ── JWT internal claim keys (never show to user) ─────────────────

const JWT_INTERNAL_KEYS = new Set([
  'iss', 'sub', 'iat', 'exp', 'nbf', 'jti', 'aud',
  'vct', 'cnf', 'status', '_sd', '_sd_alg',
  'subjectDid',
]);

/** Filter out JWT internal claims, return only user-facing ones */
export function filterUserClaims(claims: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(claims)) {
    if (!JWT_INTERNAL_KEYS.has(key) && !key.startsWith('_')) {
      filtered[key] = value;
    }
  }
  return filtered;
}

// ── Date formatting ──────────────────────────────────────────────

/** Format a date string or Date to a readable format: "4 Apr 2025" */
export function formatDate(input: string | Date | undefined | null): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format a date with time: "4 Apr 2025, 14:30" */
export function formatDateTime(input: string | Date | undefined | null): string {
  if (!input) return '—';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── DID formatting ───────────────────────────────────────────────

/** Truncate a DID for display: "did:key:z6Mk...X4pR" */
export function truncateDid(did: string, prefixLen = 16, suffixLen = 4): string {
  if (!did || did.length <= prefixLen + suffixLen + 3) return did;
  return `${did.slice(0, prefixLen)}...${did.slice(-suffixLen)}`;
}

/** Extract a short name from a DID (for when no issuerName is available) */
export function didDisplayName(did: string): string {
  if (!did) return 'Unknown';
  if (did.startsWith('did:key:')) return `DID Key ${did.slice(-6)}`;
  if (did.startsWith('did:web:')) return did.replace('did:web:', '');
  return truncateDid(did);
}

// ── Claim value formatting ───────────────────────────────────────

/** Format a claim value for display */
export function formatClaimValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    // Check if it looks like a Unix timestamp (seconds)
    if (value > 1_000_000_000 && value < 2_000_000_000) {
      return formatDate(new Date(value * 1000));
    }
    return value.toLocaleString();
  }
  const str = String(value);
  // Check if the value is an ISO date string
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) return formatDate(d);
  }
  return str;
}
