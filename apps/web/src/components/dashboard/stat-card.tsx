'use client';

import { cn } from '@/lib/utils';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { data: Array<{ value: number }>; color: string };
  accentColor?: string;
  className?: string;
}

const accentBgMap: Record<string, string> = {
  primary: 'bg-primary/10 text-primary ring-primary/20',
  success: 'bg-success/10 text-success ring-success/20',
  destructive: 'bg-destructive/10 text-destructive ring-destructive/20',
  info: 'bg-info/10 text-info ring-info/20',
  warning: 'bg-warning/10 text-warning ring-warning/20',
};

const hoverBorderMap: Record<string, string> = {
  primary: 'group-hover:border-primary/30',
  success: 'group-hover:border-success/30',
  destructive: 'group-hover:border-destructive/30',
  info: 'group-hover:border-info/30',
  warning: 'group-hover:border-warning/30',
};

export function StatCard({ label, value, icon, trend, accentColor = 'primary', className }: StatCardProps) {
  const accentClasses = accentBgMap[accentColor] ?? accentBgMap.primary;
  const hoverBorder = hoverBorderMap[accentColor] ?? hoverBorderMap.primary;

  return (
    <div
      className={cn(
        'bg-card rounded-2xl p-5 relative overflow-hidden group',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
        'border border-border/50 transition-all duration-300 ease-out',
        'hover:-translate-y-0.5',
        hoverBorder,
        'h-full',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center ring-1 transition-shadow duration-300',
          'group-hover:ring-2',
          accentClasses,
        )}>
          {icon}
        </div>
      </div>

      <div className="mt-4 h-10">
        {trend && trend.data.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend.data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`spark-${label.replace(/\s+/g, '-').toLowerCase()}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trend.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={trend.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={trend.color}
                strokeWidth={1.5}
                fill={`url(#spark-${label.replace(/\s+/g, '-').toLowerCase()})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card rounded-2xl p-5 animate-pulse shadow-[var(--shadow-card)] border border-border/50 h-full">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
        <div className="w-11 h-11 bg-muted rounded-xl" />
      </div>
      <div className="mt-4 h-10 bg-muted/30 rounded" />
    </div>
  );
}
