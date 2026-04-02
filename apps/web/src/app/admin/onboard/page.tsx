'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { UserPlus, Check, Copy, Envelope } from '@phosphor-icons/react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

const onboardSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['issuer', 'verifier']),
  credentialTypes: z.string().optional(),
  description: z.string().optional(),
});

type OnboardValues = z.infer<typeof onboardSchema>;

const ROLES = [
  { value: 'issuer', label: 'Issuer' },
  { value: 'verifier', label: 'Verifier' },
] as const;

interface OnboardResult {
  user: { email: string; name: string; role: string };
  temporaryPassword: string;
  did: string | null;
  issuer: Record<string, unknown> | null;
}

export default function OnboardPage() {
  const [result, setResult] = useState<OnboardResult | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm<OnboardValues>({
    resolver: zodResolver(onboardSchema),
    defaultValues: { name: '', email: '', role: 'issuer', credentialTypes: '', description: '' },
  });

  const selectedRole = form.watch('role');

  async function onSubmit(values: OnboardValues) {
    try {
      const payload: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        role: values.role,
      };

      if (values.role === 'issuer') {
        if (values.credentialTypes) {
          payload.credentialTypes = values.credentialTypes.split(',').map((s) => s.trim()).filter(Boolean);
        }
        if (values.description) payload.description = values.description;
      }

      const data = await api.post<OnboardResult>('/trust/onboard', payload);
      setResult(data);
      toast.success(`${values.role === 'issuer' ? 'Issuer' : 'Verifier'} onboarded successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to onboard user';
      toast.error(message);
    }
  }

  async function handleCopy() {
    if (!result) return;
    const text = `Email: ${result.user.email}\nTemporary Password: ${result.temporaryPassword}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Credentials copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setResult(null);
    setCopied(false);
    form.reset();
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
          <UserPlus size={20} className="text-warning" weight="duotone" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Onboard User</h2>
          <p className="text-muted-foreground text-sm">Create an issuer or verifier account and send login credentials via email.</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="form" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] p-6 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Account Details</h3>

                <div className="space-y-2">
                  <Label htmlFor="onboard-name">Full Name</Label>
                  <Input id="onboard-name" placeholder="Organization or person name" {...form.register('name')} />
                  {form.formState.errors.name && (
                    <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="onboard-email">Email</Label>
                  <Input id="onboard-email" type="email" placeholder="user@organization.com" {...form.register('email')} />
                  {form.formState.errors.email && (
                    <p className="text-destructive text-xs">{form.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Controller
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {selectedRole === 'issuer' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-card border border-border rounded-xl p-6 space-y-4"
                >
                  <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Trust Registry (Issuer Only)</h3>
                  <p className="text-xs text-muted-foreground">A DID (Decentralized Identifier) will be auto-generated for this issuer.</p>

                  <div className="space-y-2">
                    <Label htmlFor="onboard-types">Credential Types</Label>
                    <Input id="onboard-types" placeholder="VerifiableEducationCredential, VerifiableIncomeCredential" {...form.register('credentialTypes')} />
                    <p className="text-xs text-muted-foreground">Comma-separated list of credential types this issuer can issue.</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onboard-desc">Description</Label>
                    <Input id="onboard-desc" placeholder="Brief description of the issuer" {...form.register('description')} />
                  </div>
                </motion.div>
              )}

              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                <Envelope size={16} className="mr-2" />
                {form.formState.isSubmitting ? 'Creating account...' : 'Create Account & Send Credentials'}
              </Button>
            </form>
          </motion.div>
        ) : (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-6">
            <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
              <div className="bg-success/10 border-b border-success/20 px-6 py-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                  <Check size={20} className="text-success" weight="bold" />
                </div>
                <div>
                  <h3 className="font-semibold">Account Created</h3>
                  <p className="text-sm text-muted-foreground">Login credentials have been sent via email.</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Name</p>
                    <p className="text-sm font-medium">{result.user.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Role</p>
                    <p className="text-sm font-medium capitalize">{result.user.role}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-sm font-mono">{result.user.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Temporary Password</p>
                    <p className="text-sm font-mono font-bold text-primary">{result.temporaryPassword}</p>
                  </div>
                </div>

                {result.did && (
                  <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 mt-2 space-y-1">
                    <p className="text-xs font-medium text-primary">Issuer DID (auto-generated)</p>
                    <p className="text-xs font-mono text-muted-foreground break-all">{result.did}</p>
                    {result.issuer && (
                      <p className="text-xs text-muted-foreground mt-1">Trust registry entry created.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border/50 px-6 py-4 flex items-center gap-3">
                <Button variant="outline" onClick={handleCopy}>
                  {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />}
                  {copied ? 'Copied' : 'Copy Credentials'}
                </Button>
                <Button onClick={handleReset}>
                  <UserPlus size={16} className="mr-2" />
                  Onboard Another
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
