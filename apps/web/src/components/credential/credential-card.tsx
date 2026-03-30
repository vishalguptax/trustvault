'use client';

import { cn, truncateDid, formatDate, getCredentialAccentClass } from '@/lib/utils';
import { StatusBadge } from './status-badge';

interface CredentialCardProps {
  type: string;
  subjectDid: string;
  status: 'active' | 'revoked' | 'suspended' | 'expired';
  issuedAt: string;
  claims?: Record<string, string>;
  className?: string;
}

function CredentialTypeIcon({ type }: { type: string }) {
  if (type.includes('Education')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
        <path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87v48.42a15.91,15.91,0,0,0,4.06,10.65C49.16,191.53,78.51,216,128,216a130,130,0,0,0,48-8.76V130.67l16-8.53v40.58a8,8,0,0,0,16,0V116.53l43.76-23.47A8,8,0,0,0,251.76,88.94Z" />
      </svg>
    );
  }
  if (type.includes('Income')) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
        <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm12,152h-4v8a8,8,0,0,1-16,0v-8H104a8,8,0,0,1,0-16h36a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h16a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24a28,28,0,0,1,0,56Z" />
      </svg>
    );
  }
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
      <path d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24ZM96,48h64a8,8,0,0,1,0,16H96a8,8,0,0,1,0-16Zm84,168H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Zm0-48H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Zm0-48H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Z" />
    </svg>
  );
}

export function CredentialCard({
  type,
  subjectDid,
  status,
  issuedAt,
  claims,
  className,
}: CredentialCardProps) {
  const accentClass = getCredentialAccentClass(type);

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl overflow-hidden transition-all hover:border-muted-foreground/30',
        className
      )}
    >
      {/* Accent top bar */}
      <div className={cn('h-1', `bg-${accentClass}`)} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', `bg-${accentClass}/10 text-${accentClass}`)}>
              <CredentialTypeIcon type={type} />
            </div>
            <div>
              <p className="text-sm font-semibold">{type.replace('Verifiable', '').replace('Credential', ' Credential').trim()}</p>
              <p className="text-xs text-muted-foreground font-mono">{truncateDid(subjectDid)}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Claims preview */}
        {claims && Object.keys(claims).length > 0 && (
          <div className="mt-3 space-y-1.5">
            {Object.entries(claims).slice(0, 3).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className="text-foreground font-medium truncate ml-2 max-w-[60%] text-right">{value}</span>
              </div>
            ))}
            {Object.keys(claims).length > 3 && (
              <p className="text-xs text-muted-foreground">+{Object.keys(claims).length - 3} more claims</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Issued {formatDate(issuedAt)}</p>
        </div>
      </div>
    </div>
  );
}
