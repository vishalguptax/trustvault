import { cn } from '@/lib/utils';

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        active
          ? 'bg-success/10 text-success border-success/20'
          : 'bg-muted text-muted-foreground border-border',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', active ? 'bg-success' : 'bg-muted-foreground')} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
