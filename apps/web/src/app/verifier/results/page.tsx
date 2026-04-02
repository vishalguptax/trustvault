'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { api } from '@/lib/api/client';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchFilter } from '@/components/ui/search-filter';

interface VerificationResult {
  id: string;
  credentialTypes: string[];
  result: 'verified' | 'rejected';
  createdAt: string;
}

export default function VerificationResultsPage() {
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'rejected'>('all');

  const resultFilters = ['all', 'verified', 'rejected'] as const;

  const filteredResults = useMemo(() => {
    const query = search.toLowerCase();
    return results.filter((r) => {
      const matchesSearch =
        !query ||
        r.id.toLowerCase().includes(query) ||
        (r.credentialTypes ?? []).some((t) => t.toLowerCase().includes(query));
      const matchesFilter = filter === 'all' || r.result === filter;
      return matchesSearch && matchesFilter;
    });
  }, [results, search, filter]);

  useEffect(() => {
    async function fetchResults() {
      try {
        const data = await api.get<VerificationResult[]>('/verifier/presentations');
        setResults(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch results';
        setError(message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Verification Results</h2>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}</p>
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-warning"
            onClick={() => {
              setError(null);
              setLoading(true);
              api.get<VerificationResult[]>('/verifier/presentations').then((data) => {
                setResults(data);
                setError(null);
              }).catch((err) => {
                const message = err instanceof Error ? err.message : 'Failed to fetch results';
                setError(message);
                setResults([]);
              }).finally(() => setLoading(false));
            }}
          >
            Retry
          </Button>
        </div>
      )}

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by ID or credential type..."
        filterGroups={[
          {
            key: 'result',
            value: filter,
            onChange: (v) => setFilter(v as typeof filter),
            options: resultFilters.map((f) => ({ value: f, label: f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) })),
          },
        ]}
        resultCount={filteredResults.length}
        hasActiveFilters={filter !== 'all'}
        onClearAll={() => { setFilter('all'); setSearch(''); }}
      />

      <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">
              {results.length === 0 ? 'No verification results yet.' : 'No results match your search or filter.'}
            </p>
            {results.length === 0 && (
              <Button variant="link" size="sm" className="text-info mt-2" asChild>
                <Link href="/verifier/requests/new">Create a verification request</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Request ID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Credential Types</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Result</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result, index) => (
                  <motion.tr
                    key={result.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{result.id.slice(0, 12)}...</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(result.credentialTypes ?? []).map((type) => {
                          const safeType = type ?? '';
                          const isEducation = safeType.includes('Education');
                          const isIncome = safeType.includes('Income');
                          const displayName = safeType.replace('Verifiable', '').replace('Credential', '').trim() || 'Unknown';
                          return (
                            <span
                              key={type}
                              className={cn(
                                'inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium',
                                isEducation && 'bg-credential-education/10 text-credential-education',
                                isIncome && 'bg-credential-income/10 text-credential-income',
                                !isEducation && !isIncome && 'bg-credential-identity/10 text-credential-identity'
                              )}
                            >
                              {displayName}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border',
                          result.result === 'verified'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-destructive/10 text-destructive border-destructive/20'
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', result.result === 'verified' ? 'bg-success' : 'bg-destructive')} />
                        {result.result === 'verified' ? 'Verified' : 'Rejected'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(result.createdAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <Button variant="outline" size="sm" className="text-xs h-7 px-2.5" asChild>
                        <Link href={`/verifier/results/${result.id}`}>View Detail</Link>
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
