'use client';

import { cn } from '@/lib/utils';

type CredentialStatus = 'active' | 'revoked' | 'suspended' | 'expired';

interface StatusBadgeProps {
  status: CredentialStatus;
  className?: string;
}

const statusConfig: Record<CredentialStatus, { label: string; classes: string }> = {
  active: {
    label: 'Active',
    classes: 'bg-success/10 text-success border-success/20',
  },
  revoked: {
    label: 'Revoked',
    classes: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  suspended: {
    label: 'Suspended',
    classes: 'bg-warning/10 text-warning border-warning/20',
  },
  expired: {
    label: 'Expired',
    classes: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.active;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.classes,
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          status === 'active' && 'bg-success',
          status === 'revoked' && 'bg-destructive',
          status === 'suspended' && 'bg-warning',
          status === 'expired' && 'bg-muted-foreground'
        )}
      />
      {config.label}
    </span>
  );
}
