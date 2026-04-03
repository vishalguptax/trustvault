'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Copy, Check } from '@phosphor-icons/react';
import { ColumnDef } from '@tanstack/react-table';
import { cn, truncateDid, formatDate } from '@/lib/utils';
import { trapFocus } from '@/lib/focus-trap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchFilter } from '@/components/ui/search-filter';
import { DataTable, BulkAction } from '@/components/ui/data-table';
import { Label } from '@/components/ui/label';
import { CredentialTypeBadge } from '@/components/credential/credential-type-badge';
import { ActiveBadge } from '@/components/credential/active-badge';
import { useTrustedIssuers, useRegisterIssuer, useRemoveIssuer } from '@/hooks/use-trust';
import type { TrustedIssuer } from '@/lib/api/trust';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  did: z.string().min(1, 'DID is required').startsWith('did:', 'Must be a valid DID'),
  description: z.string().optional(),
  credentialTypes: z.array(z.string()).min(1, 'Select at least one credential type'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const CREDENTIAL_TYPE_OPTIONS = [
  { value: 'VerifiableEducationCredential', label: 'Education', accent: 'credential-education' },
  { value: 'VerifiableIncomeCredential', label: 'Income', accent: 'credential-income' },
  { value: 'VerifiableIdentityCredential', label: 'Identity', accent: 'credential-identity' },
];

const accentClasses: Record<string, { bg: string; border: string; text: string; selectedBg: string; selectedBorder: string }> = {
  'credential-education': { bg: 'bg-credential-education/5', border: 'border-credential-education/50', text: 'text-credential-education', selectedBg: 'bg-credential-education', selectedBorder: 'border-credential-education' },
  'credential-income': { bg: 'bg-credential-income/5', border: 'border-credential-income/50', text: 'text-credential-income', selectedBg: 'bg-credential-income', selectedBorder: 'border-credential-income' },
  'credential-identity': { bg: 'bg-credential-identity/5', border: 'border-credential-identity/50', text: 'text-credential-identity', selectedBg: 'bg-credential-identity', selectedBorder: 'border-credential-identity' },
};

export default function TrustedIssuersPage() {
  const { data: issuers = [], isLoading: loading, error: queryError, refetch } = useTrustedIssuers();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch issuers') : null;
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TrustedIssuer | null>(null);
  const [bulkRemoving, setBulkRemoving] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const registerIssuer = useRegisterIssuer();
  const removeIssuer = useRemoveIssuer();

  const filteredIssuers = useMemo(() => {
    const query = search.toLowerCase();
    return issuers.filter((issuer) => {
      const matchesSearch = !query ||
        issuer.name.toLowerCase().includes(query) ||
        issuer.did.toLowerCase().includes(query);
      const matchesType = typeFilter === 'all' || issuer.credentialTypes.some((ct) => ct.includes(typeFilter));
      return matchesSearch && matchesType;
    });
  }, [issuers, search, typeFilter]);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', did: '', description: '', credentialTypes: [], website: '' },
  });

  async function handleRegister(values: RegisterFormValues) {
    registerIssuer.mutate(
      { did: values.did, name: values.name, credentialTypes: values.credentialTypes, description: values.description || undefined },
      {
        onSuccess: () => { toast.success(`Issuer "${values.name}" registered`); setShowRegisterDialog(false); form.reset(); },
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to register issuer'),
      },
    );
  }

  function handleRemove() {
    if (!removeTarget) return;
    removeIssuer.mutate(removeTarget.did, {
      onSuccess: () => { toast.success(`Issuer "${removeTarget.name}" removed`); setRemoveTarget(null); },
      onError: (err) => toast.error(err instanceof Error ? err.message : 'Failed to remove issuer'),
    });
  }

  async function handleCopyDid(did: string) {
    try { await navigator.clipboard.writeText(did); toast.success('DID copied to clipboard'); }
    catch { toast.error('Failed to copy DID'); }
  }

  const columns: ColumnDef<TrustedIssuer, unknown>[] = useMemo(() => [
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
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: 'did',
      header: 'DID',
      cell: ({ row }) => (
        <button onClick={() => handleCopyDid(row.original.did)} className="flex items-center gap-1.5 group" title="Click to copy">
          <span className="font-mono text-xs text-muted-foreground">{truncateDid(row.original.did)}</span>
          <Copy size={14} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
        </button>
      ),
    },
    {
      id: 'credentialTypes',
      header: 'Credential Types',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.credentialTypes.map((type) => (<CredentialTypeBadge key={type} type={type} />))}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => <ActiveBadge active={row.original.status === 'active'} />,
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered',
      cell: ({ row }) => <span className="text-xs text-muted-foreground">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="text-xs h-7 px-2.5">Edit</Button>
          <Button variant="outline" size="sm" onClick={() => setRemoveTarget(row.original)} className="text-xs h-7 px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">Remove</Button>
        </div>
      ),
    },
  ], [filteredIssuers]);

  const bulkActions: BulkAction[] = [
    {
      label: bulkRemoving ? 'Removing...' : 'Remove Selected',
      onClick: async (selectedRows) => {
        setBulkRemoving(true);
        const targets = Object.keys(selectedRows).filter((k) => selectedRows[k]).map((k) => filteredIssuers[parseInt(k)]);
        let successCount = 0;
        for (const issuer of targets) {
          try {
            await new Promise<void>((resolve, reject) => {
              removeIssuer.mutate(issuer.did, { onSuccess: () => { successCount++; resolve(); }, onError: reject });
            });
          } catch { /* continue */ }
        }
        toast.success(`${successCount} issuer(s) removed`);
        setBulkRemoving(false);
      },
      variant: 'destructive',
      disabled: bulkRemoving,
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">Trusted Issuers</h2>
        <Button onClick={() => setShowRegisterDialog(true)} className="bg-warning text-background hover:bg-warning/90">
          Register New Issuer
        </Button>
      </div>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}</p>
          </div>
          <Button variant="link" size="sm" onClick={() => refetch()} className="text-warning flex-shrink-0 ml-4">Retry</Button>
        </div>
      )}

      <SearchFilter
        search={search}
        onSearchChange={setSearch}
        placeholder="Search by name or DID..."
        resultCount={filteredIssuers.length}
        onClearAll={() => { setSearch(''); setTypeFilter('all'); }}
      />

      <div className="flex gap-1.5 items-center mb-4">
        {['all', 'Education', 'Income', 'Identity'].map((t) => (
          <Button key={t} variant={typeFilter === t ? 'default' : 'ghost'} size="sm" className="h-8 px-3 text-xs" onClick={() => setTypeFilter(t)}>
            {t === 'all' ? 'All Types' : t}
          </Button>
        ))}
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredIssuers}
          loading={loading}
          emptyMessage={issuers.length === 0 ? 'No trusted issuers registered yet.' : 'No issuers match your search.'}
          emptyAction={
            issuers.length === 0 ? (
              <Button variant="link" size="sm" onClick={() => setShowRegisterDialog(true)} className="text-warning mt-2">
                Register the first issuer
              </Button>
            ) : undefined
          }
          bulkActions={bulkActions}
        />
      </div>

      {/* Register Dialog */}
      <AnimatePresence>
        {showRegisterDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !registerIssuer.isPending && setShowRegisterDialog(false)} onKeyDown={(e) => { if (e.key === 'Escape' && !registerIssuer.isPending) { setShowRegisterDialog(false); form.reset(); } }} role="dialog" aria-modal="true" aria-labelledby="register-dialog-title" tabIndex={-1}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} onKeyDown={trapFocus}>
              <h3 id="register-dialog-title" className="text-lg font-semibold mb-4">Register New Issuer</h3>
              <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <Label htmlFor="register-name">Name <span className="text-destructive">*</span></Label>
                  <Input id="register-name" {...form.register('name')} className={cn('mt-1.5', form.formState.errors.name && 'border-destructive')} placeholder="e.g., Delhi University" />
                  {form.formState.errors.name && <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="register-did">DID <span className="text-destructive">*</span></Label>
                  <Input id="register-did" {...form.register('did')} className={cn('mt-1.5 font-mono', form.formState.errors.did && 'border-destructive')} placeholder="did:key:z..." />
                  {form.formState.errors.did && <p className="text-destructive text-xs mt-1">{form.formState.errors.did.message}</p>}
                </div>
                <div>
                  <Label htmlFor="register-description">Description</Label>
                  <textarea id="register-description" {...form.register('description')} rows={2} className="mt-1.5 flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none" placeholder="Brief description of the issuer" />
                </div>
                <div>
                  <Label>Credential Types <span className="text-destructive">*</span></Label>
                  <div className="space-y-2 mt-1.5">
                    {CREDENTIAL_TYPE_OPTIONS.map((opt) => {
                      const currentTypes = form.watch('credentialTypes');
                      const isSelected = currentTypes.includes(opt.value);
                      const styles = accentClasses[opt.accent];
                      return (
                        <button key={opt.value} type="button" onClick={() => { const current = form.getValues('credentialTypes'); form.setValue('credentialTypes', isSelected ? current.filter((t) => t !== opt.value) : [...current, opt.value], { shouldValidate: true }); }} className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all', isSelected && styles ? `${styles.border} ${styles.bg}` : 'border-border hover:border-muted-foreground/30')}>
                          <div className={cn('w-4 h-4 rounded border flex items-center justify-center', isSelected && styles ? `${styles.selectedBorder} ${styles.selectedBg}` : 'border-muted')}>
                            {isSelected && <Check size={10} color="white" />}
                          </div>
                          <span className={cn(styles?.text)}>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {form.formState.errors.credentialTypes && <p className="text-destructive text-xs mt-1">{form.formState.errors.credentialTypes.message}</p>}
                </div>
                <div>
                  <Label htmlFor="register-website">Website</Label>
                  <Input id="register-website" {...form.register('website')} className={cn('mt-1.5', form.formState.errors.website && 'border-destructive')} placeholder="https://example.com" />
                  {form.formState.errors.website && <p className="text-destructive text-xs mt-1">{form.formState.errors.website.message}</p>}
                </div>
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/50">
                  <Button type="button" variant="outline" onClick={() => { setShowRegisterDialog(false); form.reset(); }} disabled={registerIssuer.isPending}>Cancel</Button>
                  <Button type="submit" disabled={registerIssuer.isPending} className="bg-warning text-background hover:bg-warning/90">{registerIssuer.isPending ? 'Registering...' : 'Register Issuer'}</Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Confirmation Dialog */}
      <AnimatePresence>
        {removeTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !removeIssuer.isPending && setRemoveTarget(null)} onKeyDown={(e) => { if (e.key === 'Escape' && !removeIssuer.isPending) setRemoveTarget(null); }} role="dialog" aria-modal="true" aria-labelledby="remove-dialog-title" aria-describedby="remove-dialog-description" tabIndex={-1}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()} onKeyDown={trapFocus}>
              <h3 id="remove-dialog-title" className="text-lg font-semibold mb-2">Remove Trusted Issuer</h3>
              <p id="remove-dialog-description" className="text-sm text-muted-foreground mb-1">Are you sure you want to remove this issuer from the trust registry? Credentials issued by this entity will no longer pass trust verification.</p>
              <div className="bg-muted/50 rounded-lg p-3 my-4">
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{removeTarget.name}</p>
                <p className="text-xs text-muted-foreground mt-2">DID</p>
                <p className="text-sm font-mono text-xs">{removeTarget.did}</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => setRemoveTarget(null)} disabled={removeIssuer.isPending}>Cancel</Button>
                <Button variant="destructive" onClick={handleRemove} disabled={removeIssuer.isPending}>{removeIssuer.isPending ? 'Removing...' : 'Confirm Remove'}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
