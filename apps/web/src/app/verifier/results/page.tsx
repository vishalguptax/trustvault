'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { api } from '@/lib/api/client';
import { cn, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

      <div className="bg-card border border-border rounded-xl overflow-hidden">
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
        ) : results.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No verification results yet.</p>
            <Button variant="link" size="sm" className="text-info mt-2" asChild>
              <Link href="/verifier/requests/new">Create a verification request</Link>
            </Button>
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
                {results.map((result, index) => (
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
                        {result.credentialTypes.map((type) => {
                          const isEducation = type.includes('Education');
                          const isIncome = type.includes('Income');
                          const displayName = type.replace('Verifiable', '').replace('Credential', '').trim();
                          return (
                            <span
                              key={type}
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
                      <Button variant="ghost" size="sm" className="h-auto p-0 text-xs" asChild>
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
