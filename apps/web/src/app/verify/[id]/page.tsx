'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, Check, Clock, Warning } from '@phosphor-icons/react';
import { TrustiLockLogo } from '@/components/ui/trustilock-logo';
import { API_BASE_URL } from '@/lib/constants';
import { QRDisplay } from '@/components/qr/qr-display';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface VerificationDetails {
  id: string;
  credentialTypes: string[];
  verifierName: string;
  purpose: string;
  requestUri: string;
  status: 'pending' | 'verified' | 'rejected';
  expiresAt: string;
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function ShareableVerificationPage() {
  const params = useParams();
  const id = params.id as string;
  const [details, setDetails] = useState<VerificationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`${API_BASE_URL}/verifier/presentations/${id}/details`);
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Verification request not found' : 'Failed to load verification request');
        }
        const data: VerificationDetails = await res.json();
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading verification request...</p>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
            <Warning size={32} className="text-destructive" />
          </div>
          <h2 className="text-xl font-bold mb-2">Request Not Found</h2>
          <p className="text-sm text-muted-foreground">{error ?? 'This verification request does not exist or has expired.'}</p>
        </div>
      </div>
    );
  }

  const isExpired = new Date(details.expiresAt).getTime() < Date.now();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <TrustiLockLogo size={20} className="text-primary" />
        </div>
        <span className="text-foreground font-semibold text-sm">TrustiLock</span>
      </div>

      <div className="glass-card rounded-2xl p-8 max-w-md w-full">
        {/* Title */}
        <div className="text-center mb-6">
          <div className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3',
            details.status === 'verified' ? 'bg-success/10' : details.status === 'rejected' ? 'bg-destructive/10' : 'bg-info/10'
          )}>
            {details.status === 'verified' ? (
              <Check size={28} className="text-success" weight="bold" />
            ) : details.status === 'rejected' ? (
              <Warning size={28} className="text-destructive" weight="bold" />
            ) : (
              <ShieldCheck size={28} className="text-info" weight="duotone" />
            )}
          </div>
          <h2 className="text-xl font-bold mb-1">
            {details.status === 'verified'
              ? 'Verification Complete'
              : details.status === 'rejected'
                ? 'Verification Rejected'
                : 'Credential Verification Request'}
          </h2>
        </div>

        {/* Result states */}
        {details.status === 'verified' && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              The credentials have been successfully verified.
            </p>
            <div className="bg-success/10 border border-success/20 rounded-xl p-4">
              <p className="text-success font-medium text-sm">Verified</p>
            </div>
          </div>
        )}

        {details.status === 'rejected' && (
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              The credential verification was rejected.
            </p>
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
              <p className="text-destructive font-medium text-sm">Rejected</p>
            </div>
          </div>
        )}

        {/* Pending state */}
        {details.status === 'pending' && (
          <>
            {/* Verifier info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Verifier</span>
                <span className="font-medium">{details.verifierName}</span>
              </div>
              {details.purpose && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Purpose</span>
                  <span className="font-medium">{details.purpose}</span>
                </div>
              )}
              <div className="text-sm">
                <span className="text-muted-foreground block mb-1.5">Required credentials:</span>
                <div className="flex flex-wrap gap-1.5">
                  {details.credentialTypes.map((type) => (
                    <span
                      key={type}
                      className="bg-info/10 text-info text-xs font-medium px-2.5 py-1 rounded-full"
                    >
                      {type.replace('Verifiable', '').replace('Credential', ' Credential')}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* QR Code */}
            {!isExpired ? (
              <>
                <div className="border-t border-border/50 pt-6">
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Scan with TrustiLock Wallet to present your credentials
                  </p>
                  <QRDisplay value={details.requestUri} size={240} waiting />
                </div>

                {/* Open in wallet */}
                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      window.location.href = details.requestUri;
                    }}
                  >
                    Open in TrustiLock Wallet
                  </Button>
                </div>

                {/* Expiry */}
                <ExpiryCountdown expiresAt={new Date(details.expiresAt)} />
              </>
            ) : (
              <div className="border-t border-border/50 pt-6 text-center">
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
                  <Clock size={24} className="text-destructive mx-auto mb-2" />
                  <p className="text-destructive font-medium text-sm">This request has expired</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-muted-foreground mt-6">
        Powered by TrustiLock — Verifiable Credential Ecosystem
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Expiry Countdown                                                    */
/* ------------------------------------------------------------------ */

function ExpiryCountdown({ expiresAt }: { expiresAt: Date }) {
  const [remaining, setRemaining] = useState('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    function update() {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setExpired(true);
        setRemaining('Expired');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <div className={cn('mt-4 text-center text-sm', expired ? 'text-destructive' : 'text-muted-foreground')}>
      {expired ? (
        <span>Request expired. Ask the verifier for a new link.</span>
      ) : (
        <span>Expires in <span className="font-mono font-medium text-foreground">{remaining}</span></span>
      )}
    </div>
  );
}
