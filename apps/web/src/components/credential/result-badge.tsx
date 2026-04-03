import { cn } from '@/lib/utils';

export function ResultBadge({ result }: { result: 'verified' | 'rejected' | 'pending' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        result === 'verified' && 'bg-success/10 text-success border-success/20',
        result === 'rejected' && 'bg-destructive/10 text-destructive border-destructive/20',
        result === 'pending' && 'bg-warning/10 text-warning border-warning/20',
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          result === 'verified' && 'bg-success',
          result === 'rejected' && 'bg-destructive',
          result === 'pending' && 'bg-warning',
        )}
      />
      {result === 'verified' ? 'Verified' : result === 'rejected' ? 'Rejected' : 'Pending'}
    </span>
  );
}
