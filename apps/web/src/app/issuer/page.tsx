'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { cn, truncateDid, formatDate } from '@/lib/utils';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { StatusBadge } from '@/components/credential/status-badge';

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
        <Link
          href="/issuer/offers/new"
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity text-center sm:text-left"
        >
          New Credential Offer
        </Link>
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
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24ZM96,48h64a8,8,0,0,1,0,16H96a8,8,0,0,1,0-16Zm88,160H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Zm0-48H72a8,8,0,0,1,0-16H184a8,8,0,0,1,0,16Z" />
                  </svg>
                }
                trend={stats ? { data: stats.recentTrend, color: 'hsl(174, 58%, 40%)' } : undefined}
                accentColor="primary"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatCard
                label="Active"
                value={stats?.active ?? 0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                  </svg>
                }
                trend={stats ? { data: generateMockTrend(stats.active), color: 'hsl(160, 60%, 45%)' } : undefined}
                accentColor="success"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatCard
                label="Revoked"
                value={stats?.revoked ?? 0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                  </svg>
                }
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
          <button
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
            className="text-warning text-xs font-medium hover:underline flex-shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Recent Issuances */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Issuances</h3>
          <Link href="/issuer/credentials" className="text-primary text-sm hover:underline">
            View all
          </Link>
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
            <Link
              href="/issuer/offers/new"
              className="text-primary text-sm hover:underline mt-2 inline-block"
            >
              Create your first credential offer
            </Link>
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
                      <span className="font-mono text-xs text-muted-foreground">{truncateDid(cred.subjectDid)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={cred.status} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(cred.issuedAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/issuer/credentials?id=${cred.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          View
                        </Link>
                        {cred.status === 'active' && (
                          <span className="text-xs text-destructive hover:underline cursor-pointer">
                            Revoke
                          </span>
                        )}
                      </div>
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
  const isEducation = type.includes('Education');
  const isIncome = type.includes('Income');
  const displayName = type.replace('Verifiable', '').replace('Credential', '').trim();

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
