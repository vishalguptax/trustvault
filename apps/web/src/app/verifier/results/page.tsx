'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SearchFilter } from '@/components/ui/search-filter';
import { DataTable } from '@/components/ui/data-table';
import { CredentialTypeBadge } from '@/components/credential/credential-type-badge';
import { ResultBadge } from '@/components/credential/result-badge';
import { usePresentations } from '@/hooks/use-verifier';

interface PresentationResult {
  id: string;
  credentialTypes?: string[];
  result: string;
  createdAt: string;
}

export default function VerificationResultsPage() {
  const { data: results = [], isLoading: loading, error: queryError, refetch } = usePresentations();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch results') : null;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'verified' | 'rejected'>('all');

  const resultFilters = ['all', 'verified', 'rejected'] as const;

  const filteredResults = useMemo(() => {
    const query = search.toLowerCase();
    return results.filter((r: PresentationResult) => {
      const matchesSearch = !query || r.id.toLowerCase().includes(query) || (r.credentialTypes ?? []).some((t: string) => t.toLowerCase().includes(query));
      const matchesFilter = filter === 'all' || r.result === filter;
      return matchesSearch && matchesFilter;
    });
  }, [results, search, filter]);

  const columns: ColumnDef<PresentationResult, unknown>[] = [
    {
      accessorKey: 'id',
      header: 'Request ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.id.slice(0, 12)}...</span>
      ),
    },
    {
      id: 'credentialTypes',
      header: 'Credential Types',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {(row.original.credentialTypes ?? []).map((type: string) => (<CredentialTypeBadge key={type} type={type} />))}
        </div>
      ),
    },
    {
      accessorKey: 'result',
      header: 'Result',
      cell: ({ row }) => <ResultBadge result={row.original.result as 'verified' | 'rejected'} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button variant="outline" size="sm" className="text-xs h-7 px-2.5" asChild>
          <Link href={`/verifier/results/${row.original.id}`}>View Detail</Link>
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Verification Results</h2>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}</p>
          </div>
          <Button variant="link" size="sm" className="text-warning" onClick={() => refetch()}>Retry</Button>
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

      <div className="glass-card rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredResults}
          loading={loading}
          emptyMessage={results.length === 0 ? 'No verification results yet.' : 'No results match your search or filter.'}
          emptyAction={
            results.length === 0 ? (
              <Button variant="link" size="sm" className="text-info mt-2" asChild>
                <Link href="/verifier/requests/new">Create a verification request</Link>
              </Button>
            ) : undefined
          }
          bulkActions={[]}
        />
      </div>
    </div>
  );
}
