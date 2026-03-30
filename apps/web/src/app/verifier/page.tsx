'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/client';
import { cn, formatDate } from '@/lib/utils';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';

interface VerificationResult {
  id: string;
  credentialTypes: string[];
  result: 'verified' | 'rejected';
  createdAt: string;
  verifierDid?: string;
}

interface VerifierStats {
  total: number;
  verified: number;
  rejected: number;
}

function generateMockTrend(base: number): Array<{ value: number }> {
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(0, base + Math.floor(Math.random() * 4 - 2) * (i + 1)),
  }));
}

export default function VerifierDashboard() {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [stats, setStats] = useState<VerifierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await api.get<VerificationResult[]>('/verifier/presentations');
        setResults(data);
        const verified = data.filter((r) => r.result === 'verified').length;
        setStats({
          total: data.length,
          verified,
          rejected: data.length - verified,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch results';
        setError(message);
        setStats({ total: 0, verified: 0, rejected: 0 });
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">Verifier Dashboard</h2>
        <Link
          href="/verifier/requests/new"
          className="bg-info text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity text-center sm:text-left"
        >
          New Verification Request
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
                label="Total Verifications"
                value={stats?.total ?? 0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                  </svg>
                }
                trend={stats ? { data: generateMockTrend(stats.total), color: 'hsl(217, 91%, 60%)' } : undefined}
                accentColor="info"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatCard
                label="Verified"
                value={stats?.verified ?? 0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                  </svg>
                }
                trend={stats ? { data: generateMockTrend(stats.verified), color: 'hsl(160, 60%, 45%)' } : undefined}
                accentColor="success"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatCard
                label="Rejected"
                value={stats?.rejected ?? 0}
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z" />
                  </svg>
                }
                trend={stats ? { data: generateMockTrend(stats.rejected), color: 'hsl(0, 84%, 60%)' } : undefined}
                accentColor="destructive"
              />
            </motion.div>
          </>
        )}
      </div>

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
              api.get<VerificationResult[]>('/verifier/presentations').then((data) => {
                setResults(data);
                const verified = data.filter((r) => r.result === 'verified').length;
                setStats({ total: data.length, verified, rejected: data.length - verified });
              }).catch((err) => {
                const message = err instanceof Error ? err.message : 'Failed to fetch results';
                setError(message);
                setStats({ total: 0, verified: 0, rejected: 0 });
                setResults([]);
              }).finally(() => setLoading(false));
            }}
            className="text-warning text-xs font-medium hover:underline flex-shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Recent Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Results</h3>
          <Link href="/verifier/results" className="text-info text-sm hover:underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No verification results yet.</p>
            <Link href="/verifier/requests/new" className="text-info text-sm hover:underline mt-2 inline-block">
              Create your first verification request
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Request ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Credential Types</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Result</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((result) => (
                  <tr key={result.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{result.id.slice(0, 12)}...</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {result.credentialTypes.map((type) => (
                          <CredentialTypeBadge key={type} type={type} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <ResultBadge result={result.result} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(result.createdAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <Link href={`/verifier/results/${result.id}`} className="text-xs text-info hover:underline">
                        View Detail
                      </Link>
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

function ResultBadge({ result }: { result: 'verified' | 'rejected' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        result === 'verified'
          ? 'bg-success/10 text-success border-success/20'
          : 'bg-destructive/10 text-destructive border-destructive/20'
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', result === 'verified' ? 'bg-success' : 'bg-destructive')} />
      {result === 'verified' ? 'Verified' : 'Rejected'}
    </span>
  );
}

function CredentialTypeBadge({ type }: { type: string }) {
  const isEducation = type.includes('Education');
  const isIncome = type.includes('Income');
  const displayName = type.replace('Verifiable', '').replace('Credential', '').trim();

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
        isEducation && 'bg-credential-education/10 text-credential-education',
        isIncome && 'bg-credential-income/10 text-credential-income',
        !isEducation && !isIncome && 'bg-credential-identity/10 text-credential-identity'
      )}
    >
      {displayName}
    </span>
  );
}
