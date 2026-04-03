'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { MagnifyingGlass, CheckCircle, XCircle } from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { StatCard, StatCardSkeleton } from '@/components/dashboard/stat-card';
import { CredentialTypeBadge } from '@/components/credential/credential-type-badge';
import { ResultBadge } from '@/components/credential/result-badge';
import { usePresentations } from '@/hooks/use-verifier';

function generateMockTrend(base: number): Array<{ value: number }> {
  return Array.from({ length: 7 }, (_, i) => ({
    value: Math.max(0, base + Math.floor(Math.random() * 4 - 2) * (i + 1)),
  }));
}

export default function VerifierDashboard() {
  const { data: results = [], isLoading: loading, error: queryError, refetch } = usePresentations();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch results') : null;

  const verified = results.filter((r) => r.result === 'verified').length;
  const rejected = results.length - verified;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">Verifier Dashboard</h2>
        <Button asChild><Link href="/verifier/requests/new">New Verification Request</Link></Button>
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
                value={results.length}
                icon={<MagnifyingGlass size={20} weight="duotone" />}
                trend={{ data: generateMockTrend(results.length), color: 'hsl(217, 91%, 60%)' }}
                accentColor="info"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <StatCard
                label="Verified"
                value={verified}
                icon={<CheckCircle size={20} weight="duotone" />}
                trend={{ data: generateMockTrend(verified), color: 'hsl(160, 60%, 45%)' }}
                accentColor="success"
              />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <StatCard
                label="Rejected"
                value={rejected}
                icon={<XCircle size={20} weight="duotone" />}
                trend={{ data: generateMockTrend(rejected), color: 'hsl(0, 84%, 60%)' }}
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
          <Button variant="link" size="sm" className="text-warning flex-shrink-0 ml-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Recent Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Recent Results</h3>
          <Button variant="link" size="sm" className="text-info" asChild><Link href="/verifier/results">View all</Link></Button>
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
            <Button variant="link" size="sm" className="text-info mt-2" asChild><Link href="/verifier/requests/new">Create your first verification request</Link></Button>
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
                        {(result.credentialTypes ?? []).map((type) => (
                          <CredentialTypeBadge key={type} type={type} />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <ResultBadge result={result.result as 'verified' | 'rejected'} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(result.createdAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <Button variant="outline" size="sm" className="text-xs h-7 px-2.5" asChild><Link href={`/verifier/results/${result.id}`}>View Detail</Link></Button>
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
