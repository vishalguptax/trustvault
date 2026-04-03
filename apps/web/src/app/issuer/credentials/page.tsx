'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ArrowClockwise } from '@phosphor-icons/react';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/credential/status-badge';
import { CredentialTypeBadge } from '@/components/credential/credential-type-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchFilter } from '@/components/ui/search-filter';
import { DataTable, BulkAction } from '@/components/ui/data-table';
import { CopyableDid } from '@/components/ui/copyable-did';
import { trapFocus } from '@/lib/focus-trap';
import { useCredentials, useRevokeCredential } from '@/hooks/use-issuer';
import type { Credential } from '@/lib/api/issuer';

export default function IssuedCredentialsPage() {
  const { data: credentials = [], isLoading: loading, error: queryError, refetch } = useCredentials();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch credentials') : null;
  const [revokeTarget, setRevokeTarget] = useState<Credential | null>(null);
  const [bulkRevoking, setBulkRevoking] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'revoked' | 'suspended'>('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const revokeCredential = useRevokeCredential();

  const statusFilters = ['all', 'active', 'revoked', 'suspended'] as const;
  const typeFilters = ['all', 'Education', 'Income', 'Identity'] as const;

  const filteredCredentials = useMemo(() => {
    const query = search.toLowerCase();
    return credentials.filter((cred) => {
      const matchesSearch = !query || cred.type.toLowerCase().includes(query) || cred.subjectDid.toLowerCase().includes(query);
      const matchesFilter = filter === 'all' || cred.status === filter;
      const matchesType = typeFilter === 'all' || cred.type.includes(typeFilter);
      return matchesSearch && matchesFilter && matchesType;
    });
  }, [credentials, search, filter, typeFilter]);

  function handleRevoke() {
    if (!revokeTarget) return;
    revokeCredential.mutate(
      { credentialId: revokeTarget.id, reason: 'Revoked by issuer' },
      {
        onSuccess: () => { toast.success(`Credential ${revokeTarget.id.slice(0, 8)} revoked`); setRevokeTarget(null); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to revoke credential'),
      },
    );
  }

  const columns: ColumnDef<Credential, unknown>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'type',
      header: 'Type',
      cell: ({ row }) => <CredentialTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: 'subjectDid',
      header: 'Subject DID',
      cell: ({ row }) => <CopyableDid did={row.original.subjectDid} />,
    },
    {
      accessorKey: 'issuerDid',
      header: 'Issuer',
      cell: ({ row }) => <CopyableDid did={row.original.issuerDid} />,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'issuedAt',
      header: 'Issued',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.issuedAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          {row.original.status === 'active' && (
            <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive" onClick={() => setRevokeTarget(row.original)}>Revoke</Button>
          )}
        </div>
      ),
    },
  ], [filteredCredentials]);

  const bulkActions: BulkAction[] = [
    {
      label: bulkRevoking ? 'Revoking...' : 'Revoke Selected',
      onClick: async (selectedRows) => {
        setBulkRevoking(true);
        const targets = Object.keys(selectedRows)
          .filter((k) => selectedRows[k])
          .map((k) => filteredCredentials[parseInt(k)])
          .filter((c) => c.status === 'active');
        let successCount = 0;
        for (const cred of targets) {
          try {
            await new Promise<void>((resolve, reject) => {
              revokeCredential.mutate(
                { credentialId: cred.id, reason: 'Bulk revoked by issuer' },
                { onSuccess: () => { successCount++; resolve(); }, onError: reject },
              );
            });
          } catch { /* continue */ }
        }
        toast.success(`${successCount} credential(s) revoked`);
        setBulkRevoking(false);
      },
      variant: 'destructive',
      disabled: bulkRevoking,
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Issued Credentials</h2>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <ArrowClockwise size={16} weight="duotone" />
          Refresh
        </Button>
      </div>

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
        placeholder="Search by type or DID..."
        filterGroups={[
          {
            key: 'status',
            value: filter,
            onChange: (v) => setFilter(v as typeof filter),
            options: statusFilters.map((f) => ({ value: f, label: f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1) })),
          },
          {
            key: 'type',
            value: typeFilter,
            onChange: (v) => setTypeFilter(v === typeFilter ? 'all' : v),
            options: [
              { value: 'all', label: 'All Types' },
              ...typeFilters.filter((t) => t !== 'all').map((t) => ({ value: t, label: t })),
            ],
          },
        ]}
        resultCount={filteredCredentials.length}
        hasActiveFilters={filter !== 'all' || typeFilter !== 'all'}
        onClearAll={() => { setFilter('all'); setTypeFilter('all'); setSearch(''); }}
      />

      <div className="glass-card rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCredentials}
          loading={loading}
          emptyMessage={credentials.length === 0 ? 'No credentials have been issued yet.' : 'No credentials match your search or filter.'}
          bulkActions={bulkActions}
        />
      </div>

      {/* Revoke Confirmation Dialog */}
      <AnimatePresence>
        {revokeTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !revokeCredential.isPending && setRevokeTarget(null)} onKeyDown={(e) => { if (e.key === 'Escape' && !revokeCredential.isPending) setRevokeTarget(null); }} role="dialog" aria-modal="true" aria-labelledby="revoke-dialog-title" aria-describedby="revoke-dialog-description" tabIndex={-1}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} onKeyDown={trapFocus}>
              <h3 id="revoke-dialog-title" className="text-lg font-semibold mb-2">Revoke Credential</h3>
              <p id="revoke-dialog-description" className="text-sm text-muted-foreground mb-1">Are you sure you want to revoke this credential? This action cannot be undone.</p>
              <div className="bg-muted/50 rounded-lg p-3 my-4">
                <p className="text-xs text-muted-foreground">Credential ID</p>
                <p className="text-sm font-mono">{revokeTarget.id}</p>
                <p className="text-xs text-muted-foreground mt-2">Type</p>
                <p className="text-sm">{revokeTarget.type}</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button variant="ghost" onClick={() => setRevokeTarget(null)} disabled={revokeCredential.isPending}>Cancel</Button>
                <Button variant="destructive" onClick={handleRevoke} disabled={revokeCredential.isPending}>{revokeCredential.isPending ? 'Revoking...' : 'Confirm Revoke'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
