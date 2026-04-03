import { cn } from '@/lib/utils';

export function CredentialTypeBadge({ type }: { type: string }) {
  const safeType = type ?? '';
  const isEducation = safeType.includes('Education');
  const isIncome = safeType.includes('Income');
  const displayName = safeType.replace('Verifiable', '').replace('Credential', '').trim() || 'Unknown';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
        isEducation && 'bg-credential-education/10 text-credential-education',
        isIncome && 'bg-credential-income/10 text-credential-income',
        !isEducation && !isIncome && 'bg-credential-identity/10 text-credential-identity',
      )}
    >
      {displayName}
    </span>
  );
}
