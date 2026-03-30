'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/client';
import { cn, truncateDid, formatDate } from '@/lib/utils';
import { VerificationPipeline } from '@/components/verification/pipeline';

interface PipelineCheck {
  name: string;
  label: string;
  passed: boolean;
}

interface DisclosedClaim {
  key: string;
  label: string;
  value: string;
}

interface CredentialPresentation {
  type: string;
  issuerDid: string;
  subjectDid: string;
  disclosedClaims: DisclosedClaim[];
}

interface VerificationDetail {
  id: string;
  result: 'verified' | 'rejected';
  checks: PipelineCheck[];
  credentials: CredentialPresentation[];
  verifierDid: string;
  nonce: string;
  timestamp: string;
  policies: string[];
}

const FALLBACK_DETAIL: VerificationDetail = {
  id: 'demo-result-001',
  result: 'verified',
  checks: [
    { name: 'signature', label: 'Signature', passed: true },
    { name: 'expiration', label: 'Expiration', passed: true },
    { name: 'status', label: 'Status', passed: true },
    { name: 'trust', label: 'Trust', passed: true },
    { name: 'policy', label: 'Policy', passed: true },
  ],
  credentials: [
    {
      type: 'VerifiableEducationCredential',
      issuerDid: 'did:key:zDnaeducationissuer123456789',
      subjectDid: 'did:key:zDnaewalletholder987654321',
      disclosedClaims: [
        { key: 'institutionName', label: 'Institution Name', value: 'IIT Delhi' },
        { key: 'degree', label: 'Degree', value: 'B.Tech Computer Science' },
        { key: 'graduationDate', label: 'Graduation Date', value: '2024-05-15' },
      ],
    },
  ],
  verifierDid: 'did:key:zDnaeverifier000000000001',
  nonce: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  timestamp: new Date().toISOString(),
  policies: ['require-trusted-issuer', 'require-active-status', 'require-non-expired'],
};

export default function VerificationResultDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const data = await api.get<VerificationDetail>(`/verifier/presentations/${id}`);
        setDetail(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch result';
        setError(message);
        // Use fallback for demo
        setDetail({ ...FALLBACK_DETAIL, id });
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="w-16 h-16 bg-muted rounded-xl" />
          <div className="space-y-2">
            <div className="h-6 w-40 bg-muted rounded" />
            <div className="h-4 w-32 bg-muted rounded" />
          </div>
        </div>
        <div className="h-32 bg-card border border-border rounded-xl animate-pulse" />
        <div className="h-48 bg-card border border-border rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Result not found.</p>
        <Link href="/verifier/results" className="text-info text-sm hover:underline mt-2 inline-block">
          Back to results
        </Link>
      </div>
    );
  }

  const isVerified = detail.result === 'verified';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back link */}
      <Link href="/verifier/results" className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
          <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z" />
        </svg>
        Back to Results
      </Link>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-3">
          <p className="text-warning text-xs">{error}. Showing demo data.</p>
        </div>
      )}

      {/* Result Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
        className="flex flex-col items-center py-6"
      >
        <motion.div
          className={cn(
            'w-24 h-24 rounded-2xl flex items-center justify-center mb-4',
            isVerified ? 'bg-success/10 border-2 border-success' : 'bg-destructive/10 border-2 border-destructive'
          )}
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
        >
          {isVerified ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="hsl(160 60% 45%)" viewBox="0 0 256 256">
              <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="hsl(0 84% 60%)" viewBox="0 0 256 256">
              <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
            </svg>
          )}
        </motion.div>

        <motion.h2
          className={cn('text-3xl font-bold', isVerified ? 'text-success' : 'text-destructive')}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isVerified ? 'VERIFIED' : 'REJECTED'}
        </motion.h2>
        <motion.p
          className="text-sm text-muted-foreground mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Presentation ID: <span className="font-mono">{detail.id.slice(0, 16)}...</span>
        </motion.p>
      </motion.div>

      {/* Verification Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl p-8"
      >
        <h3 className="text-lg font-semibold text-center mb-6">Verification Pipeline</h3>
        <VerificationPipeline checks={detail.checks} />
      </motion.div>

      {/* Credential Data */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold">Disclosed Credentials</h3>
        {detail.credentials.map((cred, i) => {
          const isEducation = cred.type.includes('Education');
          const isIncome = cred.type.includes('Income');
          const accent = isEducation ? 'credential-education' : isIncome ? 'credential-income' : 'credential-identity';
          const displayType = cred.type.replace('Verifiable', '').replace('Credential', ' Credential').trim();

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className={cn('h-1', `bg-${accent}`)} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className={cn('font-semibold', `text-${accent}`)}>{displayType}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Issuer: <span className="font-mono">{truncateDid(cred.issuerDid)}</span>
                    </p>
                  </div>
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium', `bg-${accent}/10 text-${accent}`)}>
                    {cred.disclosedClaims.length} claims disclosed
                  </span>
                </div>

                <div className="space-y-2">
                  {cred.disclosedClaims.map((claim) => (
                    <div key={claim.key} className="flex items-center justify-between bg-muted/30 rounded-lg px-4 py-2.5">
                      <span className="text-sm text-muted-foreground">{claim.label}</span>
                      <span className="text-sm font-medium text-foreground">{claim.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4">Verification Metadata</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetadataItem label="Verifier DID" value={truncateDid(detail.verifierDid)} mono />
          <MetadataItem label="Nonce" value={detail.nonce.slice(0, 24) + '...'} mono />
          <MetadataItem label="Timestamp" value={formatDate(detail.timestamp)} />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Policies Applied</p>
            <div className="flex flex-wrap gap-1">
              {detail.policies.map((p) => (
                <span key={p} className="text-xs bg-info/10 text-info px-2 py-0.5 rounded-full">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function MetadataItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-sm', mono && 'font-mono')}>{value}</p>
    </div>
  );
}
