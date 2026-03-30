'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { cn, truncateDid, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/credential/status-badge';

interface Credential {
  id: string;
  type: string;
  subjectDid: string;
  issuerDid: string;
  status: 'active' | 'revoked' | 'suspended' | 'expired';
  issuedAt: string;
  claims?: Record<string, string>;
}

export default function IssuedCredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<Credential | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  async function fetchCredentials() {
    setLoading(true);
    try {
      const data = await api.get<Credential[]>('/issuer/credentials');
      setCredentials(data);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch credentials';
      setError(message);
      setCredentials([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      await api.post(`/issuer/credentials/${revokeTarget.id}/revoke`, {});
      toast.success(`Credential ${revokeTarget.id.slice(0, 8)} revoked`);
      setCredentials((prev) =>
        prev.map((c) => (c.id === revokeTarget.id ? { ...c, status: 'revoked' as const } : c))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to revoke credential';
      toast.error(message);
    } finally {
      setRevoking(false);
      setRevokeTarget(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Issued Credentials</h2>
        <button
          onClick={fetchCredentials}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Refresh
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
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-4 w-40 bg-muted rounded" />
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-16 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-4 w-20 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : credentials.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground text-sm">No credentials have been issued yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Type</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Subject DID</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Issuer</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Issued</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map((cred) => (
                  <tr
                    key={cred.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === cred.id ? null : cred.id)}
                  >
                    <td className="px-6 py-3">
                      <CredentialTypeBadge type={cred.type} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{truncateDid(cred.subjectDid)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{truncateDid(cred.issuerDid)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={cred.status} />
                    </td>
                    <td className="px-6 py-3">
                      <span className="text-xs text-muted-foreground">{formatDate(cred.issuedAt)}</span>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setExpandedId(expandedId === cred.id ? null : cred.id)}
                          className="text-xs text-primary hover:underline"
                        >
                          {expandedId === cred.id ? 'Hide' : 'View'}
                        </button>
                        {cred.status === 'active' && (
                          <button
                            onClick={() => setRevokeTarget(cred)}
                            className="text-xs text-destructive hover:underline"
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revoke Confirmation Dialog */}
      <AnimatePresence>
        {revokeTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => !revoking && setRevokeTarget(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-2">Revoke Credential</h3>
              <p className="text-sm text-muted-foreground mb-1">
                Are you sure you want to revoke this credential? This action cannot be undone.
              </p>
              <div className="bg-muted/50 rounded-lg p-3 my-4">
                <p className="text-xs text-muted-foreground">Credential ID</p>
                <p className="text-sm font-mono">{revokeTarget.id}</p>
                <p className="text-xs text-muted-foreground mt-2">Type</p>
                <p className="text-sm">{revokeTarget.type}</p>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setRevokeTarget(null)}
                  disabled={revoking}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  disabled={revoking}
                  className={cn(
                    'bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-medium transition-opacity',
                    revoking ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  )}
                >
                  {revoking ? 'Revoking...' : 'Confirm Revoke'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CredentialTypeBadge({ type }: { type: string }) {
  const isEducation = type.includes('Education');
  const isIncome = type.includes('Income');
  const displayName = type.replace('Verifiable', '').replace('Credential', '').trim();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium',
        isEducation && 'bg-credential-education/10 text-credential-education',
        isIncome && 'bg-credential-income/10 text-credential-income',
        !isEducation && !isIncome && 'bg-credential-identity/10 text-credential-identity'
      )}
    >
      {displayName}
    </span>
  );
}
