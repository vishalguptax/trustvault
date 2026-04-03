'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  Copy, Check, Clock, CheckCircle, XCircle, Hourglass,
  QrCode, ArrowRight, Plus, FileArrowUp, FunnelSimple, X,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { QRDisplay } from '@/components/qr/qr-display';
import { CredentialTypeBadge } from '@/components/credential/credential-type-badge';
import { schemaTypeToAccent, getAccentStyles } from '@/lib/credential-styles';
import { useOffers } from '@/hooks/use-issuer';
import type { Offer } from '@/lib/api/issuer';

/* ------------------------------------------------------------------ */
/* Status config                                                       */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  className: string;
  dotClass: string;
}> = {
  pending: {
    label: 'Pending',
    icon: <Hourglass size={14} weight="bold" />,
    className: 'text-warning bg-warning/10 border-warning/20',
    dotClass: 'bg-warning',
  },
  token_issued: {
    label: 'In Progress',
    icon: <Clock size={14} weight="bold" />,
    className: 'text-info bg-info/10 border-info/20',
    dotClass: 'bg-info',
  },
  credential_issued: {
    label: 'Claimed',
    icon: <CheckCircle size={14} weight="bold" />,
    className: 'text-success bg-success/10 border-success/20',
    dotClass: 'bg-success',
  },
  expired: {
    label: 'Expired',
    icon: <XCircle size={14} weight="bold" />,
    className: 'text-muted-foreground bg-muted/50 border-border',
    dotClass: 'bg-muted-foreground',
  },
};

type StatusFilter = 'all' | 'pending' | 'token_issued' | 'credential_issued' | 'expired';

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function OffersListPage() {
  const { data: offers = [], isLoading, error: queryError, refetch } = useOffers();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to load offers') : null;

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [qrOffer, setQrOffer] = useState<Offer | null>(null);

  const filtered = useMemo(() => {
    if (filter === 'all') return offers;
    return offers.filter((o) => o.status === filter);
  }, [offers, filter]);

  const counts = useMemo(() => ({
    all: offers.length,
    pending: offers.filter((o) => o.status === 'pending').length,
    token_issued: offers.filter((o) => o.status === 'token_issued').length,
    credential_issued: offers.filter((o) => o.status === 'credential_issued').length,
    expired: offers.filter((o) => o.status === 'expired').length,
  }), [offers]);

  async function copyUri(uri: string) {
    try {
      await navigator.clipboard.writeText(uri);
      toast.success('Offer URI copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }

  function getClaimSummary(claims: Record<string, unknown>): string {
    const name = claims.documentName || claims.candidateName || claims.employeeName || claims.fullName;
    if (name) return String(name);
    const values = Object.values(claims).filter((v) => typeof v === 'string' && v.length > 0);
    return values.length > 0 ? String(values[0]) : 'No claims';
  }

  const filterButtons: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'credential_issued', label: 'Claimed' },
    { key: 'expired', label: 'Expired' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Credential Offers</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track, share, and manage all issued credential offers.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/issuer/offers/batch">
              <FileArrowUp size={16} className="mr-1.5" /> Bulk Issue
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/issuer/offers/new">
              <Plus size={16} className="mr-1.5" /> New Offer
            </Link>
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">Failed to load offers</p>
            <p className="text-warning/70 text-xs mt-1">{error}</p>
          </div>
          <Button variant="link" size="sm" className="text-warning" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <FunnelSimple size={16} className="text-muted-foreground flex-shrink-0" />
        {filterButtons.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              filter === key
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card text-muted-foreground border-border hover:text-foreground hover:border-muted-foreground/30'
            )}
          >
            {label}
            <span className="ml-1.5 opacity-70">{counts[key]}</span>
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-muted rounded" />
                  <div className="h-3 w-32 bg-muted rounded" />
                </div>
                <div className="h-6 w-20 bg-muted rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <QrCode size={32} className="text-muted-foreground" />
          </div>
          {filter === 'all' ? (
            <>
              <h3 className="text-lg font-semibold mb-1">No offers yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a credential offer to get started. Holders scan the QR code to receive their credential.
              </p>
              <Button asChild>
                <Link href="/issuer/offers/new">
                  <Plus size={16} className="mr-1.5" /> Create First Offer
                </Link>
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-lg font-semibold mb-1">No {filterButtons.find((f) => f.key === filter)?.label.toLowerCase()} offers</h3>
              <p className="text-sm text-muted-foreground">
                Try a different filter to see other offers.
              </p>
            </>
          )}
        </motion.div>
      )}

      {/* Offers list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((offer, idx) => {
            const statusCfg = STATUS_CONFIG[offer.status] ?? STATUS_CONFIG.expired;
            const accentKey = schemaTypeToAccent[offer.schemaTypeUri] ?? 'primary';
            const styles = getAccentStyles(accentKey);
            const claimSummary = getClaimSummary(offer.claims);
            const isPending = offer.status === 'pending';

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                className="glass-card rounded-xl p-4 hover:bg-muted/20 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  {/* Accent bar + icon */}
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', styles.iconBg)}>
                    <div className={cn('w-2 h-2 rounded-full', statusCfg.dotClass)} />
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium truncate">{claimSummary}</span>
                      <CredentialTypeBadge type={offer.schemaTypeUri} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatDate(offer.createdAt)}</span>
                      {isPending && (
                        <span className="text-warning/80">
                          Expires {formatDate(offer.expiresAt)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className={cn(
                    'px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 flex-shrink-0',
                    statusCfg.className
                  )}>
                    {statusCfg.icon}
                    {statusCfg.label}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isPending && offer.credentialOfferUri && (
                      <>
                        <button
                          onClick={() => copyUri(offer.credentialOfferUri!)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          aria-label="Copy offer URI"
                          title="Copy offer URI"
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          onClick={() => setQrOffer(offer)}
                          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          aria-label="Show QR code"
                          title="Show QR code"
                        >
                          <QrCode size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* QR Code Modal */}
      <AnimatePresence>
        {qrOffer && qrOffer.credentialOfferUri && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setQrOffer(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative glass-card rounded-2xl p-8 max-w-md w-full z-10"
            >
              <button
                onClick={() => setQrOffer(null)}
                className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                aria-label="Close QR code dialog"
              >
                <X size={18} />
              </button>

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold">Scan to Receive Credential</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {getClaimSummary(qrOffer.claims)}
                </p>
              </div>

              <QRDisplay
                value={qrOffer.credentialOfferUri}
                size={220}
                label="Have the holder scan this QR code with the TrustiLock Wallet app"
              />

              <div className="mt-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Expires {formatDate(qrOffer.expiresAt)}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
