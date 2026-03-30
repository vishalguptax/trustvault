'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { QRDisplay } from '@/components/qr/qr-display';

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

const FALLBACK_SCHEMAS: SchemaDefinition[] = [
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

const schemaAccents: Record<string, string> = {
  education: 'credential-education',
  income: 'credential-income',
  identity: 'credential-identity',
};

export default function NewVerificationRequestPage() {
  const [step, setStep] = useState(1);
  const [schemas, setSchemas] = useState<SchemaDefinition[]>(FALLBACK_SCHEMAS);
  const [policies] = useState<PolicyDefinition[]>(FALLBACK_POLICIES);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedClaims, setSelectedClaims] = useState<Record<string, string[]>>({});
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>(['require-trusted-issuer', 'require-active-status', 'require-non-expired']);

  const [requestUri, setRequestUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSchemas() {
      try {
        const data = await api.get<SchemaDefinition[]>('/issuer/schemas');
        if (data && data.length > 0) {
          setSchemas(data);
        }
      } catch {
        // Use fallback
      }
    }
    fetchSchemas();
  }, []);

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

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const response = await api.post<{ requestUri: string }>('/verifier/presentations/request', {
        credentialTypes: selectedTypes,
        requiredClaims: selectedClaims,
        policies: selectedPolicies,
      });
      setRequestUri(response.requestUri);
      setStep(4);
      toast.success('Verification request created');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create request';
      toast.error(message);
      // Demo fallback
      const mockUri = `openid4vp://authorize?client_id=trustvault-verifier&request_uri=https://trustvault.dev/verifier/requests/${crypto.randomUUID()}`;
      setRequestUri(mockUri);
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = ['Select Types', 'Select Claims', 'Policies', 'QR Code'];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Create Verification Request</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Select credential types, required claims, and policies to generate a verification QR code.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {stepLabels.map((label, i) => {
          const s = i + 1;
          return (
            <div key={s} className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                  s === step && 'bg-info text-white',
                  s < step && 'bg-success text-white',
                  s > step && 'bg-muted text-muted-foreground'
                )}
              >
                {s < step ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span className={cn('text-sm hidden sm:inline', s === step ? 'text-foreground' : 'text-muted-foreground')}>
                {label}
              </span>
              {i < stepLabels.length - 1 && <div className="w-6 h-px bg-border" />}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select credential types */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            {schemas.map((schema) => {
              const accent = schemaAccents[schema.id] ?? 'primary';
              const isSelected = selectedTypes.includes(schema.type);
              return (
                <button
                  key={schema.id}
                  onClick={() => toggleType(schema.type)}
                  className={cn(
                    'w-full text-left bg-card border rounded-xl p-5 transition-all',
                    isSelected ? `border-${accent} ring-1 ring-${accent}/30` : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center', isSelected ? `border-${accent} bg-${accent}` : 'border-muted')}>
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="white" viewBox="0 0 256 256">
                          <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
                        </svg>
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
              <button
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
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Select claims */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            {schemas
              .filter((s) => selectedTypes.includes(s.type))
              .map((schema) => {
                const accent = schemaAccents[schema.id] ?? 'primary';
                const currentClaims = selectedClaims[schema.type] ?? [];
                return (
                  <div key={schema.id} className="bg-card border border-border rounded-xl p-6">
                    <h3 className={cn('font-semibold mb-4', `text-${accent}`)}>{schema.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {schema.claims.map((claim) => {
                        const isSelected = currentClaims.includes(claim.key);
                        return (
                          <button
                            key={claim.key}
                            onClick={() => toggleClaim(schema.type, claim.key)}
                            className={cn(
                              'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-all',
                              isSelected ? `border-${accent}/50 bg-${accent}/5` : 'border-border hover:border-muted-foreground/30'
                            )}
                          >
                            <div className={cn('w-4 h-4 rounded border flex items-center justify-center flex-shrink-0', isSelected ? `border-${accent} bg-${accent}` : 'border-muted')}>
                              {isSelected && (
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="white" viewBox="0 0 256 256">
                                  <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
                                </svg>
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
              <button onClick={() => setStep(1)} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-info text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
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
                    'w-full text-left bg-card border rounded-xl p-5 transition-all',
                    isSelected ? 'border-info ring-1 ring-info/30' : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn('w-5 h-5 rounded border-2 flex items-center justify-center', isSelected ? 'border-info bg-info' : 'border-muted')}>
                      {isSelected && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="white" viewBox="0 0 256 256">
                          <path d="M173.66,98.34a8,8,0,0,1,0,11.32l-56,56a8,8,0,0,1-11.32,0l-24-24a8,8,0,0,1,11.32-11.32L112,148.69l50.34-50.35A8,8,0,0,1,173.66,98.34Z" />
                        </svg>
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
              <button onClick={() => setStep(2)} className="text-muted-foreground text-sm hover:text-foreground transition-colors">
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className={cn(
                  'bg-info text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity',
                  submitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                )}
              >
                {submitting ? 'Creating...' : 'Generate Request'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 4: QR Code */}
        {step === 4 && requestUri && (
          <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center">
            <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-center mb-2">Scan to Present Credentials</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Open TrustVault Wallet and scan this QR code to present your credentials
              </p>
              <QRDisplay value={requestUri} size={280} />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setRequestUri(null);
                  setSelectedTypes([]);
                  setSelectedClaims({});
                  setSelectedPolicies(['require-trusted-issuer', 'require-active-status', 'require-non-expired']);
                }}
                className="bg-card border border-border text-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Create Another
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
