'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Users, ShieldCheck, Clock, PenNib, LockKey } from '@phosphor-icons/react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Policy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

const FALLBACK_POLICIES: Policy[] = [
  {
    id: 'require-trusted-issuer',
    name: 'Require Trusted Issuer',
    description: 'Verify the credential was issued by a registered trusted issuer in the trust registry. Rejects presentations from unknown or unregistered issuers.',
    enabled: true,
  },
  {
    id: 'require-active-status',
    name: 'Require Active Status',
    description: 'Check the credential status via Bitstring Status List. Rejects credentials that have been revoked or suspended by the issuer.',
    enabled: true,
  },
  {
    id: 'require-non-expired',
    name: 'Require Non-Expired',
    description: 'Verify the credential has not passed its expiration date. Rejects presentations containing expired credentials.',
    enabled: true,
  },
  {
    id: 'require-valid-signature',
    name: 'Require Valid Signature',
    description: 'Cryptographically verify the SD-JWT-VC signature using the issuer public key. This policy is always enforced and cannot be disabled.',
    enabled: true,
  },
  {
    id: 'require-matching-holder',
    name: 'Require Matching Holder',
    description: 'Verify the presenter is the legitimate holder by checking the key binding JWT. Prevents replay attacks with stolen credentials.',
    enabled: true,
  },
];

function PolicyIcon({ policyId }: { policyId: string }) {
  const iconProps = { size: 20, weight: 'fill' as const };
  switch (policyId) {
    case 'require-trusted-issuer':
      return <Users {...iconProps} />;
    case 'require-active-status':
      return <ShieldCheck {...iconProps} />;
    case 'require-non-expired':
      return <Clock {...iconProps} />;
    case 'require-valid-signature':
      return <PenNib {...iconProps} />;
    default:
      return <LockKey {...iconProps} />;
  }
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(FALLBACK_POLICIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchPolicies() {
    setLoading(true);
    try {
      const data = await api.get<Policy[]>('/verifier/policies');
      if (data && data.length > 0) {
        setPolicies(data);
      }
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch policies';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function togglePolicy(policyId: string) {
    const policy = policies.find((p) => p.id === policyId);
    if (!policy) return;

    // Optimistic update
    setPolicies((prev) =>
      prev.map((p) => (p.id === policyId ? { ...p, enabled: !p.enabled } : p))
    );

    try {
      await api.put(`/verifier/policies/${policyId}`, { enabled: !policy.enabled });
      toast.success(`Policy "${policy.name}" ${policy.enabled ? 'disabled' : 'enabled'}`);
    } catch {
      // Revert on error
      setPolicies((prev) =>
        prev.map((p) => (p.id === policyId ? { ...p, enabled: policy.enabled } : p))
      );
      toast.error('Failed to update policy');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Verification Policies</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Configure which verification checks are enforced when validating presentations.
      </p>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}. Showing default policies.</p>
          </div>
          <Button
            variant="link"
            size="sm"
            className="text-warning"
            onClick={fetchPolicies}
          >
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl shadow-[var(--shadow-card)] p-5 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted rounded" />
                  <div className="h-3 w-64 bg-muted rounded" />
                </div>
                <div className="w-12 h-6 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {policies.map((policy, index) => (
            <motion.div
              key={policy.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-2xl shadow-[var(--shadow-card)] p-5 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', policy.enabled ? 'bg-info/10 text-info' : 'bg-muted text-muted-foreground')}>
                  <PolicyIcon policyId={policy.id} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={cn('font-semibold text-sm', !policy.enabled && 'text-muted-foreground')}>
                    {policy.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {policy.description}
                  </p>
                </div>
                <button
                  onClick={() => togglePolicy(policy.id)}
                  className={cn(
                    'relative w-12 h-6 rounded-full transition-colors flex-shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none',
                    policy.enabled ? 'bg-info' : 'bg-muted'
                  )}
                  role="switch"
                  aria-checked={policy.enabled}
                  aria-label={`${policy.name}: ${policy.enabled ? 'enabled' : 'disabled'}`}
                >
                  <div
                    className={cn(
                      'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                      policy.enabled ? 'translate-x-6' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
