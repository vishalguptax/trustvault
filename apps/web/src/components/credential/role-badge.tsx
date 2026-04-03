import { cn } from '@/lib/utils';

const roleStyles: Record<string, string> = {
  admin: 'bg-warning/10 text-warning border-warning/20',
  issuer: 'bg-primary/10 text-primary border-primary/20',
  verifier: 'bg-info/10 text-info border-info/20',
  holder: 'bg-muted text-muted-foreground border-border',
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        roleStyles[role] ?? roleStyles.holder,
      )}
    >
      {role}
    </span>
  );
}
