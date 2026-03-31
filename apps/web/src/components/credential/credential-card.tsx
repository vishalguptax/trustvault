'use client';

import { GraduationCap, CurrencyDollar, IdentificationCard } from '@phosphor-icons/react';
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

const accentStyles: Record<string, { bar: string; iconBg: string }> = {
  'credential-education': { bar: 'bg-credential-education', iconBg: 'bg-credential-education/10 text-credential-education' },
  'credential-income': { bar: 'bg-credential-income', iconBg: 'bg-credential-income/10 text-credential-income' },
  'credential-identity': { bar: 'bg-credential-identity', iconBg: 'bg-credential-identity/10 text-credential-identity' },
  'primary': { bar: 'bg-primary', iconBg: 'bg-primary/10 text-primary' },
};

function CredentialTypeIcon({ type }: { type: string }) {
  if (type.includes('Education')) {
    return <GraduationCap size={20} weight="fill" />;
  }
  if (type.includes('Income')) {
    return <CurrencyDollar size={20} weight="fill" />;
  }
  return <IdentificationCard size={20} weight="fill" />;
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
      <div className={cn('h-1', accentStyles[accentClass]?.bar ?? 'bg-primary')} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', accentStyles[accentClass]?.iconBg ?? 'bg-primary/10 text-primary')}>
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
