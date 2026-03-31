'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { Copy, Check, PencilSimple, Trash } from '@phosphor-icons/react';
import { api } from '@/lib/api/client';
import { cn, truncateDid, formatDate } from '@/lib/utils';
import { trapFocus } from '@/lib/focus-trap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const accentClasses: Record<string, { bg: string; border: string; text: string; selectedBg: string; selectedBorder: string }> = {
  'credential-education': { bg: 'bg-credential-education/5', border: 'border-credential-education/50', text: 'text-credential-education', selectedBg: 'bg-credential-education', selectedBorder: 'border-credential-education' },
  'credential-income': { bg: 'bg-credential-income/5', border: 'border-credential-income/50', text: 'text-credential-income', selectedBg: 'bg-credential-income', selectedBorder: 'border-credential-income' },
  'credential-identity': { bg: 'bg-credential-identity/5', border: 'border-credential-identity/50', text: 'text-credential-identity', selectedBg: 'bg-credential-identity', selectedBorder: 'border-credential-identity' },
};

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
        did: values.did,
        name: values.name,
        credentialTypes: values.credentialTypes,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h2 className="text-2xl font-bold">Trusted Issuers</h2>
        <Button
          onClick={() => setShowRegisterDialog(true)}
          className="bg-warning text-background hover:bg-warning/90"
        >
          Register New Issuer
        </Button>
      </div>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}</p>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={fetchIssuers}
            className="text-warning flex-shrink-0 ml-4"
          >
            Retry
          </Button>
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
            <Button
              variant="link"
              size="sm"
              onClick={() => setShowRegisterDialog(true)}
              className="text-warning mt-2"
            >
              Register the first issuer
            </Button>
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
                        <Copy size={14} className="text-muted-foreground/50 group-hover:text-foreground transition-colors" />
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
                        <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-warning">Edit</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setRemoveTarget(issuer)}
                          className="h-auto p-0 text-xs text-destructive"
                        >
                          Remove
                        </Button>
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
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !registering) {
                setShowRegisterDialog(false);
                form.reset();
              }
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="register-dialog-title"
            tabIndex={-1}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={trapFocus}
            >
              <h3 id="register-dialog-title" className="text-lg font-semibold mb-4">Register New Issuer</h3>

              <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <Label htmlFor="register-name">
                    Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="register-name"
                    {...form.register('name')}
                    className={cn(
                      'mt-1.5',
                      form.formState.errors.name && 'border-destructive'
                    )}
                    placeholder="e.g., Delhi University"
                  />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-did">
                    DID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="register-did"
                    {...form.register('did')}
                    className={cn(
                      'mt-1.5 font-mono',
                      form.formState.errors.did && 'border-destructive'
                    )}
                    placeholder="did:key:z..."
                  />
                  {form.formState.errors.did && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.did.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-description">Description</Label>
                  <textarea
                    id="register-description"
                    {...form.register('description')}
                    rows={2}
                    className="mt-1.5 flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                    placeholder="Brief description of the issuer"
                  />
                </div>

                <div>
                  <Label>
                    Credential Types <span className="text-destructive">*</span>
                  </Label>
                  <div className="space-y-2 mt-1.5">
                    {CREDENTIAL_TYPE_OPTIONS.map((opt) => {
                      const currentTypes = form.watch('credentialTypes');
                      const isSelected = currentTypes.includes(opt.value);
                      const styles = accentClasses[opt.accent];
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
                            isSelected && styles ? `${styles.border} ${styles.bg}` : 'border-border hover:border-muted-foreground/30'
                          )}
                        >
                          <div className={cn('w-4 h-4 rounded border flex items-center justify-center', isSelected && styles ? `${styles.selectedBorder} ${styles.selectedBg}` : 'border-muted')}>
                            {isSelected && (
                              <Check size={10} color="white" />
                            )}
                          </div>
                          <span className={cn(styles?.text)}>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  {form.formState.errors.credentialTypes && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.credentialTypes.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="register-website">Website</Label>
                  <Input
                    id="register-website"
                    {...form.register('website')}
                    className={cn(
                      'mt-1.5',
                      form.formState.errors.website && 'border-destructive'
                    )}
                    placeholder="https://example.com"
                  />
                  {form.formState.errors.website && (
                    <p className="text-destructive text-xs mt-1">{form.formState.errors.website.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowRegisterDialog(false);
                      form.reset();
                    }}
                    disabled={registering}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={registering}
                    className="bg-warning text-background hover:bg-warning/90"
                  >
                    {registering ? 'Registering...' : 'Register Issuer'}
                  </Button>
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
            onKeyDown={(e) => {
              if (e.key === 'Escape' && !removing) setRemoveTarget(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-dialog-title"
            aria-describedby="remove-dialog-description"
            tabIndex={-1}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={trapFocus}
            >
              <h3 id="remove-dialog-title" className="text-lg font-semibold mb-2">Remove Trusted Issuer</h3>
              <p id="remove-dialog-description" className="text-sm text-muted-foreground mb-1">
                Are you sure you want to remove this issuer from the trust registry? Credentials issued by this entity will no longer pass trust verification.
              </p>
              <div className="bg-muted/50 rounded-lg p-3 my-4">
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{removeTarget.name}</p>
                <p className="text-xs text-muted-foreground mt-2">DID</p>
                <p className="text-sm font-mono text-xs">{removeTarget.did}</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setRemoveTarget(null)}
                  disabled={removing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemove}
                  disabled={removing}
                >
                  {removing ? 'Removing...' : 'Confirm Remove'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
