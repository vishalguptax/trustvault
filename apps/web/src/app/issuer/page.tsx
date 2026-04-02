'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { File, CheckCircle, XCircle } from '@phosphor-icons/react';
import { CopyableDid } from '@/components/ui/copyable-did';
import { api } from '@/lib/api/client';
import { cn, truncateDid, formatDate } from '@/lib/utils';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/credential/status-badge';
import { Button } from '@/components/ui/button';

interface Credential {
  id: string;
  type: string;
  subjectDid: string;
  issuerDid: string;
  status: 'active' | 'revoked' | 'suspended' | 'expired';
  issuedAt: string;
}

interface IssuerStats {
  total: number;
  active: number;
  revoked: number;
  recentTrend: Array<{ value: number }>;
}

function generateMockTrend(base: number): Array<{ value: number }> {
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(0, base + Math.floor(Math.random() * 6 - 3) * (i + 1)),
  }));
}

export default function IssuerDashboard() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [stats, setStats] = useState<IssuerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.get<Credential[]>('/issuer/credentials');
        setCredentials(data);
        const active = data.filter((c) => c.status === 'active').length;
        const revoked = data.filter((c) => c.status === 'revoked').length;
        setStats({
          total: data.length,
          active,
          revoked,
          recentTrend: generateMockTrend(data.length),
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch credentials';
        setError(message);
        // Provide fallback data for demo
        setStats({ total: 0, active: 0, revoked: 0, recentTrend: [] });
        setCredentials([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">Issuer Dashboard</h2>
        <Button asChild><Link href="/issuer/offers/new">New Credential Offer</Link></Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <StatCard
                label="Total Issued"
                value={stats?.total ?? 0}
                icon={<File size={20} weight="duotone" />}
                trend={stats ? { data: stats.recentTrend, color: 'hsl(174, 58%, 40%)' } : undefined}
                accentColor="primary"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatCard
                label="Active"
                value={stats?.active ?? 0}
                icon={<CheckCircle size={20} weight="duotone" />}
                trend={stats ? { data: generateMockTrend(stats.active), color: 'hsl(160, 60%, 45%)' } : undefined}
                accentColor="success"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatCard
                label="Revoked"
                value={stats?.revoked ?? 0}
                icon={<XCircle size={20} weight="duotone" />}
                trend={stats ? { data: generateMockTrend(stats.revoked), color: 'hsl(0, 84%, 60%)' } : undefined}
                accentColor="destructive"
              />
            </motion.div>
          </>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}. Showing empty state.</p>
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-warning"
            onClick={() => {
              setError(null);
              setLoading(true);
              api.get<Credential[]>('/issuer/credentials').then((data) => {
                setCredentials(data);
                const active = data.filter((c) => c.status === 'active').length;
                const revoked = data.filter((c) => c.status === 'revoked').length;
                setStats({ total: data.length, active, revoked, recentTrend: generateMockTrend(data.length) });
              }).catch((err) => {
                const message = err instanceof Error ? err.message : 'Failed to fetch credentials';
                setError(message);
                setStats({ total: 0, active: 0, revoked: 0, recentTrend: [] });
                setCredentials([]);
              }).finally(() => setLoading(false));
            }}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Recent Issuances */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl shadow-[var(--shadow-card)] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Issuances</h3>
          <Button variant="link" size="sm" asChild><Link href="/issuer/credentials">View all</Link></Button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : credentials.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No credentials issued yet.</p>
            <Button variant="link" size="sm" asChild><Link href="/issuer/offers/new">Create your first credential offer</Link></Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Subject DID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.slice(0, 10).map((cred) => (
                  <tr key={cred.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <CredentialTypeBadge type={cred.type} />
                    </td>
                    <td className="px-6 py-3">
                      <CopyableDid did={cred.subjectDid} />
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={cred.status} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(cred.issuedAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      {cred.status === 'active' ? (
                        <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">Revoke</Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function CredentialTypeBadge({ type }: { type: string }) {
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
        !isEducation && !isIncome && 'bg-credential-identity/10 text-credential-identity'
      )}
    >
      {displayName}
    </span>
  );
}
