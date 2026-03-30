'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

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
  switch (policyId) {
    case 'require-trusted-issuer':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1,0-16,24,24,0,1,0-23.6-28.5,8,8,0,1,1-15.7-3A40,40,0,1,1,212,128a67.88,67.88,0,0,1,34.4,21.6A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176Z" />
        </svg>
      );
    case 'require-active-status':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M208,40H48A16,16,0,0,0,32,56v58.77c0,89.62,75.82,119.34,91,124.38a15.44,15.44,0,0,0,10,0c15.2-5.05,91-34.77,91-124.39V56A16,16,0,0,0,208,40Zm-34.34,69.66-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35a8,8,0,0,1,11.32,11.32Z" />
        </svg>
      );
    case 'require-non-expired':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z" />
        </svg>
      );
    case 'require-valid-signature':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M232,168H63.86c2.66-5.24,5.33-10.63,8-16.11,14.94,1.65,32.62-1.34,52.7-8.94,28.08-10.63,36.36-30.06,24.6-57.78C137.43,58.5,112.33,36.94,88,40.64c-17.5,2.66-29.71,17.29-36.29,43.46C37.7,134.49,23.27,168.05,23.27,168a8,8,0,0,0,7.32,11.26L232,179.31A8,8,0,0,0,232,168Z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Z" />
        </svg>
      );
  }
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(FALLBACK_POLICIES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const data = await api.get<Policy[]>('/verifier/policies');
        if (data && data.length > 0) {
          setPolicies(data);
        }
      } catch {
        // Use fallback
      } finally {
        setLoading(false);
      }
    }
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

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
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
              className="bg-card border border-border rounded-xl p-5 hover:border-muted-foreground/30 transition-all"
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
                    'relative w-12 h-6 rounded-full transition-colors flex-shrink-0',
                    policy.enabled ? 'bg-info' : 'bg-muted'
                  )}
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
