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
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  destructive: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
};

export function StatCard({ label, value, icon, trend, accentColor = 'primary', className }: StatCardProps) {
  const accentClasses = accentBgMap[accentColor] ?? accentBgMap.primary;

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-5 relative overflow-hidden group hover:border-muted-foreground/30 transition-all h-full',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-muted-foreground text-sm mb-1">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', accentClasses)}>
          {icon}
        </div>
      </div>

      <div className="mt-3 h-12 -mx-1">
        {trend && trend.data.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend.data}>
              <defs>
                <linearGradient id={`sparkline-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={trend.color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={trend.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={trend.color}
                strokeWidth={1.5}
                fill={`url(#sparkline-${label})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full" />
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 animate-pulse h-full">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-4 w-24 bg-muted rounded mb-2" />
          <div className="h-8 w-16 bg-muted rounded" />
        </div>
        <div className="w-10 h-10 bg-muted rounded-lg" />
      </div>
      <div className="mt-3 h-12 bg-muted/50 rounded" />
    </div>
  );
}
