'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/lib/constants';
import { useCreatePresentationRequest } from '@/hooks/use-verifier';
import { Check, Copy, ShareNetwork } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { schemaTypeToAccent, getAccentStyles } from '@/lib/credential-styles';
import { QRDisplay } from '@/components/qr/qr-display';
import { useSchemas } from '@/hooks/use-issuer';

interface SchemaDefinition {
  id: string;
  type: string;
  name: string;
  claims: { key: string; label: string }[];
}

interface PolicyDefinition {
  id: string;
  name: string;
  description: string;
}

const SIMPLE_FALLBACK_SCHEMAS: SchemaDefinition[] = [
  {
    id: 'education',
    type: 'VerifiableEducationCredential',
    name: 'Education Credential',
    claims: [
      { key: 'institutionName', label: 'Institution Name' },
      { key: 'degree', label: 'Degree' },
      { key: 'fieldOfStudy', label: 'Field of Study' },
      { key: 'graduationDate', label: 'Graduation Date' },
      { key: 'gpa', label: 'GPA' },
      { key: 'studentId', label: 'Student ID' },
    ],
  },
  {
    id: 'income',
    type: 'VerifiableIncomeCredential',
    name: 'Income Credential',
    claims: [
      { key: 'employerName', label: 'Employer Name' },
      { key: 'jobTitle', label: 'Job Title' },
      { key: 'annualIncome', label: 'Annual Income' },
      { key: 'currency', label: 'Currency' },
      { key: 'employmentStartDate', label: 'Employment Start Date' },
      { key: 'employeeId', label: 'Employee ID' },
    ],
  },
  {
    id: 'identity',
    type: 'VerifiableIdentityCredential',
    name: 'Identity Credential',
    claims: [
      { key: 'fullName', label: 'Full Name' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'nationality', label: 'Nationality' },
      { key: 'documentNumber', label: 'Document Number' },
      { key: 'address', label: 'Address' },
      { key: 'gender', label: 'Gender' },
    ],
  },
];

const FALLBACK_POLICIES: PolicyDefinition[] = [
  { id: 'require-trusted-issuer', name: 'Require Trusted Issuer', description: 'Verify the credential was issued by a registered trusted issuer.' },
  { id: 'require-active-status', name: 'Require Active Status', description: 'Check that the credential has not been revoked or suspended.' },
  { id: 'require-non-expired', name: 'Require Non-Expired', description: 'Verify the credential has not passed its expiration date.' },
];

export default function NewVerificationRequestPage() {
  const createRequest = useCreatePresentationRequest();
  const [step, setStep] = useState(1);
  const [policies] = useState<PolicyDefinition[]>(FALLBACK_POLICIES);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<Record<string, string[]>>({});
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>(['require-trusted-issuer', 'require-active-status', 'require-non-expired']);

  const [requestUri, setRequestUri] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{ status: 'verified' | 'rejected'; completedAt: string } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: fetchedSchemas } = useSchemas();
  const schemas: SchemaDefinition[] = fetchedSchemas && fetchedSchemas.length > 0
    ? fetchedSchemas.map((s) => ({ id: s.id, type: s.type, name: s.name, claims: s.claims.map((c) => ({ key: c.key, label: c.label })) }))
    : SIMPLE_FALLBACK_SCHEMAS;

  // SSE: Connect to real-time stream when QR is displayed
  useEffect(() => {
    if (step !== 4 || !requestId) return;

    const es = new EventSource(`${API_BASE_URL}/verifier/presentations/${requestId}/stream`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setVerificationResult({ status: data.status, completedAt: data.completedAt });
        toast.success(data.status === 'verified' ? 'Credential verified!' : 'Credential rejected');
        es.close();
      } catch {
        // Ignore malformed events
      }
    };

    es.onerror = () => {
      // SSE connection lost — silent fallback, user can still manually check
      es.close();
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [step, requestId]);

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function toggleClaim(type: string, claim: string) {
    setSelectedClaims((prev) => {
      const current = prev[type] ?? [];
      return {
        ...prev,
        [type]: current.includes(claim) ? current.filter((c) => c !== claim) : [...current, claim],
      };
    });
  }

  function togglePolicy(policyId: string) {
    setSelectedPolicies((prev) =>
      prev.includes(policyId) ? prev.filter((p) => p !== policyId) : [...prev, policyId]
    );
  }

  function handleSubmit() {
    setSubmitting(true);
    createRequest.mutate(
      {
        verifierDid: '',
        credentialTypes: selectedTypes,
        requiredClaims: selectedClaims,
        policies: selectedPolicies,
      },
      {
        onSuccess: (response) => {
          setRequestUri(response.authorizationRequestUri ?? (response as unknown as { requestUri: string }).requestUri);
          setRequestId(response.requestId);
          setStep(4);
          toast.success('Verification request created');
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : 'Failed to create request';
          toast.error(message);
        },
        onSettled: () => setSubmitting(false),
      },
    );
  }

  const stepLabels = ['Select Types', 'Select Claims', 'Policies', 'QR Code'];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Create Verification Request</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Select credential types, required claims, and policies to generate a verification QR code.
      </p>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {stepLabels.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center gap-0">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                    s === step && 'bg-info text-white',
                    s < step && 'bg-success text-white',
                    s > step && 'bg-muted text-muted-foreground'
                  )}
                >
                  {s < step ? (
                    <Check size={14} />
                  ) : (
                    s
                  )}
                </div>
                <span className={cn('text-sm hidden sm:inline', s === step ? 'text-foreground font-medium' : 'text-muted-foreground')}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && <div className="w-10 h-px bg-border mx-2" />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select credential types */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {schemas.map((schema) => {
              const accentKey = schemaTypeToAccent[schema.type] ?? 'primary';
              const styles = getAccentStyles(accentKey);
              const isSelected = selectedTypes.includes(schema.type);
              return (
                <button
                  key={schema.id}
                  onClick={() => toggleType(schema.type)}
                  className={cn(
                    'w-full text-left glass-card rounded-2xl p-5 transition-all',
                    isSelected ? `${styles.selectedBorder} ring-1 ${styles.selectedRing}` : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center', isSelected ? styles.checkboxOn : 'border-muted')}>
                      {isSelected && (
                        <Check size={12} color="white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{schema.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{schema.claims.length} available claims</p>
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="flex justify-end pt-4">
              <Button
                onClick={() => {
                  if (selectedTypes.length === 0) {
                    toast.error('Select at least one credential type');
                    return;
                  }
                  setStep(2);
                }}
                className="bg-info text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select claims */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            {schemas
              .filter((s) => selectedTypes.includes(s.type))
              .map((schema) => {
                const accentKey = schemaTypeToAccent[schema.type] ?? 'primary';
                const styles = getAccentStyles(accentKey);
                const currentClaims = selectedClaims[schema.type] ?? [];
                return (
                  <div key={schema.id} className="glass-card rounded-2xl p-6">
                    <h3 className={cn('font-semibold mb-4', styles.text)}>{schema.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {schema.claims.map((claim) => {
                        const isSelected = currentClaims.includes(claim.key);
                        return (
                          <button
                            key={claim.key}
                            onClick={() => toggleClaim(schema.type, claim.key)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all',
                              isSelected ? styles.claimOn : 'border-border hover:border-muted-foreground/30'
                            )}
                          >
                            <div className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0', isSelected ? styles.checkboxOn : 'border-muted')}>
                              {isSelected && (
                                <Check size={10} color="white" />
                              )}
                            </div>
                            {claim.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                className="bg-info text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Policies */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <p className="text-sm text-muted-foreground mb-2">Select verification policies to enforce on the presentation.</p>
            {policies.map((policy) => {
              const isSelected = selectedPolicies.includes(policy.id);
              return (
                <button
                  key={policy.id}
                  onClick={() => togglePolicy(policy.id)}
                  className={cn(
                    'w-full text-left glass-card rounded-2xl p-5 transition-all',
                    isSelected ? 'border-info ring-1 ring-info/30' : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center', isSelected ? 'border-info bg-info' : 'border-muted')}>
                      {isSelected && (
                        <Check size={12} color="white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{policy.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{policy.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  'bg-info text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity',
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                )}
              >
                {submitting ? 'Creating...' : 'Generate Request'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: QR Code + Live Result */}
        {step === 4 && requestUri && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
            {!verificationResult ? (
              <>
                <div className="glass-card rounded-2xl p-8 w-full max-w-md mx-auto">
                  <h3 className="text-lg font-semibold text-center mb-2">Waiting for Credential</h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    Scan this QR code with TrustiLock Wallet to present credentials
                  </p>
                  <QRDisplay value={requestUri} size={280} waiting />
                  <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                    <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                    Listening for response...
                  </div>
                  <div className="flex gap-2 mt-4 justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/verify/${requestId}`;
                        navigator.clipboard.writeText(shareUrl);
                        toast.success('Verification link copied!');
                      }}
                    >
                      <Copy size={16} className="mr-1.5" /> Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/verify/${requestId}`;
                        if (navigator.share) {
                          navigator.share({ title: 'Verify Credentials', url: shareUrl });
                        } else {
                          navigator.clipboard.writeText(shareUrl);
                          toast.success('Link copied (sharing not supported on this device)');
                        }
                      }}
                    >
                      <ShareNetwork size={16} className="mr-1.5" /> Share
                    </Button>
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      eventSourceRef.current?.close();
                      setStep(1);
                      setRequestUri(null);
                      setRequestId(null);
                      setVerificationResult(null);
                      setSelectedTypes([]);
                      setSelectedClaims({});
                      setSelectedPolicies(['require-trusted-issuer', 'require-active-status', 'require-non-expired']);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card rounded-2xl p-8 w-full max-w-md mx-auto text-center"
              >
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                  verificationResult.status === 'verified' ? 'bg-success/10' : 'bg-destructive/10'
                )}>
                  {verificationResult.status === 'verified' ? (
                    <Check size={32} className="text-success" weight="bold" />
                  ) : (
                    <span className="text-destructive text-2xl font-bold">✕</span>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1">
                  {verificationResult.status === 'verified' ? 'Verified' : 'Rejected'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {verificationResult.status === 'verified'
                    ? 'The credentials have been successfully verified.'
                    : 'The credential verification was rejected.'}
                </p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <a href={`/verifier/results/${requestId}`}>View Details</a>
                  </Button>
                  <Button
                    onClick={() => {
                      setStep(1);
                      setRequestUri(null);
                      setRequestId(null);
                      setVerificationResult(null);
                      setSelectedTypes([]);
                      setSelectedClaims({});
                      setSelectedPolicies(['require-trusted-issuer', 'require-active-status', 'require-non-expired']);
                    }}
                  >
                    Verify Another
                  </Button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
