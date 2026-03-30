'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { cn, truncateDid, formatDate } from '@/lib/utils';

interface TrustedIssuer {
  did: string;
  name: string;
  description?: string;
  credentialTypes: string[];
  website?: string;
  status: 'active' | 'suspended';
  createdAt: string;
}

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

export default function TrustedIssuersPage() {
  const [issuers, setIssuers] = useState<TrustedIssuer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TrustedIssuer | null>(null);
  const [removing, setRemoving] = useState(false);
  const [registering, setRegistering] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      did: '',
      description: '',
      credentialTypes: [],
      website: '',
    },
  });

  useEffect(() => {
    fetchIssuers();
  }, []);

  async function fetchIssuers() {
    setLoading(true);
    try {
      const data = await api.get<TrustedIssuer[]>('/trust/issuers');
      setIssuers(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch issuers';
      setError(message);
      setIssuers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(values: RegisterFormValues) {
    setRegistering(true);
    try {
      await api.post('/trust/issuers', {
        ...values,
        website: values.website || undefined,
        description: values.description || undefined,
      });
      toast.success(`Issuer "${values.name}" registered`);
      setShowRegisterDialog(false);
      form.reset();
      fetchIssuers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to register issuer';
      toast.error(message);
    } finally {
      setRegistering(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      await api.delete(`/trust/issuers/${encodeURIComponent(removeTarget.did)}`);
      toast.success(`Issuer "${removeTarget.name}" removed`);
      setIssuers((prev) => prev.filter((i) => i.did !== removeTarget.did));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove issuer';
      toast.error(message);
    } finally {
      setRemoving(false);
      setRemoveTarget(null);
    }
  }

  async function handleCopyDid(did: string) {
    try {
      await navigator.clipboard.writeText(did);
      toast.success('DID copied to clipboard');
    } catch {
      toast.error('Failed to copy DID');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Trusted Issuers</h2>
        <button
          onClick={() => setShowRegisterDialog(true)}
          className="bg-warning text-background px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Register New Issuer
        </button>
      </div>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6">
          <p className="text-warning text-sm font-medium">API Unavailable</p>
          <p className="text-warning/70 text-xs mt-1">{error}</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-48 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : issuers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No trusted issuers registered yet.</p>
            <button
              onClick={() => setShowRegisterDialog(true)}
              className="text-warning text-sm hover:underline mt-2"
            >
              Register the first issuer
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">DID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Credential Types</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Registered</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issuers.map((issuer, index) => (
                  <motion.tr
                    key={issuer.did}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <span className="text-sm font-medium">{issuer.name}</span>
                    </td>
                    <td className="px-6 py-3">
                      <button
                        onClick={() => handleCopyDid(issuer.did)}
                        className="flex items-center gap-1.5 group"
                        title="Click to copy"
                      >
                        <span className="font-mono text-xs text-muted-foreground">{truncateDid(issuer.did)}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256" className="text-muted-foreground/50 group-hover:text-foreground transition-colors">
                          <path d="M216,32H88a8,8,0,0,0-8,8V80H40a8,8,0,0,0-8,8V216a8,8,0,0,0,8,8H168a8,8,0,0,0,8-8V176h40a8,8,0,0,0,8-8V40A8,8,0,0,0,216,32ZM160,208H48V96H160Zm48-48H176V88a8,8,0,0,0-8-8H96V48H208Z" />
                        </svg>
                      </button>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-1">
                        {issuer.credentialTypes.map((type) => {
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
                          issuer.status === 'active'
                            ? 'bg-success/10 text-success border-success/20'
                            : 'bg-warning/10 text-warning border-warning/20'
                        )}
                      >
                        <span className={cn('w-1.5 h-1.5 rounded-full', issuer.status === 'active' ? 'bg-success' : 'bg-warning')} />
                        {issuer.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(issuer.createdAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-warning hover:underline">Edit</button>
                        <button
                          onClick={() => setRemoveTarget(issuer)}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Dialog */}
      <AnimatePresence>
        {showRegisterDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !registering && setShowRegisterDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Register New Issuer</h3>

              <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Name <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...form.register('name')}
                    className={cn(
                      'w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50 focus:border-warning transition-all',
                      form.formState.errors.name ? 'border-destructive' : 'border-border'
                    )}
                    placeholder="e.g., Delhi University"
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    DID <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...form.register('did')}
                    className={cn(
                      'w-full bg-background border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-warning/50 focus:border-warning transition-all',
                      form.formState.errors.did ? 'border-destructive' : 'border-border'
                    )}
                    placeholder="did:key:z..."
                  />
                  {form.formState.errors.did && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.did.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Description</label>
                  <textarea
                    {...form.register('description')}
                    rows={2}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50 focus:border-warning transition-all resize-none"
                    placeholder="Brief description of the issuer"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    Credential Types <span className="text-destructive">*</span>
                  </label>
                  <div className="space-y-2">
                    {CREDENTIAL_TYPE_OPTIONS.map((opt) => {
                      const currentTypes = form.watch('credentialTypes');
                      const isSelected = currentTypes.includes(opt.value);
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const current = form.getValues('credentialTypes');
                            form.setValue(
                              'credentialTypes',
                              isSelected ? current.filter((t) => t !== opt.value) : [...current, opt.value],
                              { shouldValidate: true }
                            );
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all',
                            isSelected ? `border-${opt.accent}/50 bg-${opt.accent}/5` : 'border-border hover:border-muted-foreground/30'
                          )}
                        >
                          <div className={cn('w-4 h-4 rounded border flex items-center justify-center', isSelected ? `border-${opt.accent} bg-${opt.accent}` : 'border-muted')}>
                            {isSelected && (
                              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="white" viewBox="0 0 256 256">
                                <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
                              </svg>
                            )}
                          </div>
                          <span className={cn(`text-${opt.accent}`)}>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {form.formState.errors.credentialTypes && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.credentialTypes.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Website</label>
                  <input
                    {...form.register('website')}
                    className={cn(
                      'w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-warning/50 focus:border-warning transition-all',
                      form.formState.errors.website ? 'border-destructive' : 'border-border'
                    )}
                    placeholder="https://example.com"
                  />
                  {form.formState.errors.website && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.website.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRegisterDialog(false);
                      form.reset();
                    }}
                    disabled={registering}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registering}
                    className={cn(
                      'bg-warning text-background px-4 py-2 rounded-lg text-sm font-medium transition-opacity',
                      registering ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                    )}
                  >
                    {registering ? 'Registering...' : 'Register Issuer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Remove Confirmation Dialog */}
      <AnimatePresence>
        {removeTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !removing && setRemoveTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Remove Trusted Issuer</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Are you sure you want to remove this issuer from the trust registry? Credentials issued by this entity will no longer pass trust verification.
              </p>
              <div className="bg-muted/50 rounded-lg p-3 my-4">
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{removeTarget.name}</p>
                <p className="text-xs text-muted-foreground mt-2">DID</p>
                <p className="text-sm font-mono text-xs">{removeTarget.did}</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setRemoveTarget(null)}
                  disabled={removing}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className={cn(
                    'bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium transition-opacity',
                    removing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  )}
                >
                  {removing ? 'Removing...' : 'Confirm Remove'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
