'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GraduationCap, CurrencyDollar, IdentificationCard, Lock, LockOpen, Check, Plus, Trash } from '@phosphor-icons/react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth/auth-store';
import { schemaTypeToAccent, getAccentStyles } from '@/lib/credential-styles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRDisplay } from '@/components/qr/qr-display';

/* ------------------------------------------------------------------ */
/* Schema definitions                                                  */
/* ------------------------------------------------------------------ */

interface SchemaDefinition {
  id: string;
  type: string;
  name: string;
  description: string;
  claims: ClaimDefinition[];
}

interface ClaimDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  selectivelyDisclosable: boolean;
}

const FALLBACK_SCHEMAS: SchemaDefinition[] = [
  {
    id: 'education',
    type: 'VerifiableEducationCredential',
    name: 'Education Credential',
    description: 'Issue academic credentials such as degrees, diplomas, and certificates.',
    claims: [
      // Required — always shown
      { key: 'documentName', label: 'Document Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'candidateName', label: 'Candidate Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'institutionName', label: 'Issuing Organization', type: 'string', required: true, selectivelyDisclosable: false },
      // Optional — issuer toggles on/off based on document type
      { key: 'degree', label: 'Degree / Certificate Title', type: 'string', required: false, selectivelyDisclosable: false },
      { key: 'fieldOfStudy', label: 'Field of Study', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'graduationDate', label: 'Date of Completion', type: 'date', required: false, selectivelyDisclosable: true },
      { key: 'gpa', label: 'GPA / CGPA', type: 'number', required: false, selectivelyDisclosable: true },
      { key: 'percentage', label: 'Percentage', type: 'number', required: false, selectivelyDisclosable: true },
      { key: 'grade', label: 'Grade', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'studentId', label: 'Student / Roll Number', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'semester', label: 'Semester / Year', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'boardName', label: 'Board / University Name', type: 'string', required: false, selectivelyDisclosable: false },
      { key: 'registrationNumber', label: 'Registration Number', type: 'string', required: false, selectivelyDisclosable: true },
    ],
  },
  {
    id: 'income',
    type: 'VerifiableIncomeCredential',
    name: 'Income Credential',
    description: 'Issue income and employment verification credentials.',
    claims: [
      // Required
      { key: 'documentName', label: 'Document Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'employeeName', label: 'Employee Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'employerName', label: 'Issuing Organization', type: 'string', required: true, selectivelyDisclosable: false },
      // Optional
      { key: 'jobTitle', label: 'Job Title / Designation', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'department', label: 'Department', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'annualIncome', label: 'Annual Income', type: 'number', required: false, selectivelyDisclosable: true },
      { key: 'monthlySalary', label: 'Monthly Salary', type: 'number', required: false, selectivelyDisclosable: true },
      { key: 'currency', label: 'Currency', type: 'string', required: false, selectivelyDisclosable: false },
      { key: 'employmentStartDate', label: 'Employment Start Date', type: 'date', required: false, selectivelyDisclosable: true },
      { key: 'employmentEndDate', label: 'Employment End Date', type: 'date', required: false, selectivelyDisclosable: true },
      { key: 'employeeId', label: 'Employee ID', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'employmentType', label: 'Employment Type', type: 'string', required: false, selectivelyDisclosable: true },
    ],
  },
  {
    id: 'identity',
    type: 'VerifiableIdentityCredential',
    name: 'Identity Credential',
    description: 'Issue government-backed identity verification credentials.',
    claims: [
      // Required
      { key: 'documentName', label: 'Document Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'fullName', label: 'Full Name', type: 'string', required: true, selectivelyDisclosable: false },
      // Optional
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: false, selectivelyDisclosable: true },
      { key: 'nationality', label: 'Nationality', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'documentNumber', label: 'Document Number', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'address', label: 'Address', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'gender', label: 'Gender', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'issuingAuthority', label: 'Issuing Authority', type: 'string', required: false, selectivelyDisclosable: false },
      { key: 'validUntil', label: 'Valid Until', type: 'date', required: false, selectivelyDisclosable: true },
      { key: 'placeOfBirth', label: 'Place of Birth', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'fatherName', label: 'Father\'s Name', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'bloodGroup', label: 'Blood Group', type: 'string', required: false, selectivelyDisclosable: true },
    ],
  },
];

function buildZodSchema(claims: ClaimDefinition[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  claims.forEach((claim) => {
    let field: z.ZodTypeAny;
    switch (claim.type) {
      case 'number':
        field = claim.required
          ? z.string().min(1, `${claim.label} is required`).refine((v) => !isNaN(Number(v)), 'Must be a number')
          : z.string().optional();
        break;
      case 'date':
        field = claim.required
          ? z.string().min(1, `${claim.label} is required`)
          : z.string().optional();
        break;
      default:
        field = claim.required
          ? z.string().min(1, `${claim.label} is required`)
          : z.string().optional();
    }
    shape[claim.key] = field;
  });
  return z.object(shape);
}

/* ------------------------------------------------------------------ */
/* Schema type icons                                                   */
/* ------------------------------------------------------------------ */

const schemaIcons: Record<string, React.ReactNode> = {
  VerifiableEducationCredential: <GraduationCap size={32} weight="duotone" />,
  VerifiableIncomeCredential: <CurrencyDollar size={32} weight="duotone" />,
  VerifiableIdentityCredential: <IdentificationCard size={32} weight="duotone" />,
};


/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function NewOfferPage() {
  const [step, setStep] = useState(1);
  const [schemas, setSchemas] = useState<SchemaDefinition[]>(FALLBACK_SCHEMAS);
  const [selectedSchema, setSelectedSchema] = useState<SchemaDefinition | null>(null);
  const [offerUri, setOfferUri] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [authorizedTypes, setAuthorizedTypes] = useState<string[]>([]);
  const [enabledOptional, setEnabledOptional] = useState<Set<string>>(new Set());
  const [customFields, setCustomFields] = useState<Array<{ key: string; label: string; value: string }>>([]);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    async function fetchSchemas() {
      try {
        const data = await api.get<SchemaDefinition[]>('/issuer/schemas');
        if (data && data.length > 0) {
          setSchemas(data);
        }
      } catch {
        // Use fallback schemas
      }
    }
    fetchSchemas();
  }, []);

  useEffect(() => {
    async function fetchAuthorization() {
      try {
        const result = await api.get<{ authorized: boolean; credentialTypes: string[]; issuer: { did: string; name: string } | null }>('/trust/issuers/me');
        if (result.authorized && result.credentialTypes.length > 0) {
          setAuthorizedTypes(result.credentialTypes);
        }
      } catch {
        // If fetch fails (admin user or no link), show all schemas
      }
    }
    fetchAuthorization();
  }, []);

  const displaySchemas = authorizedTypes.length > 0
    ? schemas.filter((s) => authorizedTypes.includes(s.type))
    : schemas;

  const allClaims = selectedSchema?.claims ?? [];
  const requiredClaims = allClaims.filter((c) => c.required);
  const optionalClaims = allClaims.filter((c) => !c.required);
  // Active claims = required + enabled optional
  const activeClaims = [...requiredClaims, ...optionalClaims.filter((c) => enabledOptional.has(c.key))];
  const zodSchema = buildZodSchema(activeClaims);
  type FormValues = z.infer<typeof zodSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(zodSchema),
    defaultValues: activeClaims.reduce<Record<string, string>>((acc, c) => {
      acc[c.key] = '';
      return acc;
    }, {}),
  });

  const handleSchemaSelect = useCallback((schema: SchemaDefinition) => {
    setSelectedSchema(schema);
    setEnabledOptional(new Set());
    setCustomFields([]);
    form.reset(
      (schema.claims ?? []).filter((c) => c.required).reduce<Record<string, string>>((acc, c) => {
        acc[c.key] = '';
        return acc;
      }, {})
    );
  }, [form]);

  const toggleOptionalField = useCallback((key: string) => {
    setEnabledOptional((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
        form.unregister(key);
      } else {
        next.add(key);
        form.register(key);
        form.setValue(key, '');
      }
      return next;
    });
  }, [form]);

  const addCustomField = useCallback(() => {
    setCustomFields((prev) => [...prev, { key: '', label: '', value: '' }]);
  }, []);

  const updateCustomField = useCallback((index: number, field: 'key' | 'label' | 'value', val: string) => {
    setCustomFields((prev) => prev.map((f, i) => i === index ? { ...f, [field]: val } : f));
  }, []);

  const removeCustomField = useCallback((index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  }, []);

  async function handleSubmit(values: FormValues) {
    if (!selectedSchema) return;

    // Merge form values + custom fields into a single claims object
    const claims: Record<string, unknown> = { ...values };
    for (const cf of customFields) {
      if (cf.key.trim()) {
        claims[cf.key.trim()] = cf.value;
      }
    }

    setSubmitting(true);
    try {
      const response = await api.post<{ offerId: string; credentialOfferUri: string; preAuthorizedCode: string }>('/issuer/offers', {
        schemaTypeUri: selectedSchema.type,
        claims,
      });
      setOfferUri(response.credentialOfferUri);
      setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
      setStep(3);
      toast.success('Credential offer created');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create offer';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Create Credential Offer</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Select a schema, fill in the claim values, and generate a QR code for the wallet holder.
      </p>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-0 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-0">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                  s === step && 'bg-primary text-primary-foreground',
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
                {s === 1 ? 'Select Schema' : s === 2 ? 'Fill Claims' : 'QR Code'}
              </span>
            </div>
            {s < 3 && <div className="w-12 h-px bg-border mx-3" />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Step 1: Select Schema */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {authorizedTypes.length > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 mb-4">
                <p className="text-xs text-primary font-medium">
                  You are authorized to issue {authorizedTypes.length} credential type{authorizedTypes.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
            {displaySchemas.map((schema) => {
              const accentKey = schemaTypeToAccent[schema.type] ?? 'primary';
              const styles = getAccentStyles(accentKey);
              const icon = schemaIcons[schema.type];
              const isSelected = selectedSchema?.type === schema.type;

              return (
                <button
                  key={schema.id}
                  onClick={() => handleSchemaSelect(schema)}
                  className={cn(
                    'w-full text-left bg-card border rounded-2xl p-5 transition-all',
                    isSelected
                      ? `${styles.selectedBorder} ring-1 ${styles.selectedRing}`
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', styles.iconBg)}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{schema.name}</h3>
                        {isSelected && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', styles.badgeBg)}>
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{schema.claims?.length ?? 0} claims</p>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1',
                      isSelected ? styles.selectedBorder : 'border-muted'
                    )}>
                      {isSelected && <div className={cn('w-2.5 h-2.5 rounded-full', styles.bar)} />}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="flex justify-end pt-4">
              <Button
                onClick={() => {
                  if (!selectedSchema) {
                    toast.error('Please select a schema');
                    return;
                  }
                  setStep(2);
                }}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Fill Claims */}
        {step === 2 && selectedSchema && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getAccentStyles(schemaTypeToAccent[selectedSchema.type] ?? 'primary').iconBg)}>
                  {schemaIcons[selectedSchema.type]}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedSchema.name}</h3>
                  <p className="text-xs text-muted-foreground">Fill in the claim values below</p>
                </div>
              </div>

              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                {/* Required Fields */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Required Fields</h4>
                  {requiredClaims.map((claim) => (
                    <ClaimInput key={claim.key} claim={claim} form={form} />
                  ))}
                </div>

                {/* Optional Fields — toggle on/off */}
                {optionalClaims.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Optional Fields — select what applies</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {optionalClaims.map((claim) => (
                        <button
                          key={claim.key}
                          type="button"
                          onClick={() => toggleOptionalField(claim.key)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                            enabledOptional.has(claim.key)
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : 'bg-card text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                          )}
                        >
                          {claim.label}
                        </button>
                      ))}
                    </div>
                    {optionalClaims.filter((c) => enabledOptional.has(c.key)).map((claim) => (
                      <ClaimInput key={claim.key} claim={claim} form={form} />
                    ))}
                  </div>
                )}

                {/* Custom Fields */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Fields</h4>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                    >
                      <Plus size={12} /> Add Field
                    </button>
                  </div>
                  {customFields.map((cf, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        value={cf.label}
                        onChange={(e) => {
                          updateCustomField(index, 'label', e.target.value);
                          updateCustomField(index, 'key', e.target.value.replace(/\s+/g, '').replace(/^./, (c) => c.toLowerCase()));
                        }}
                        placeholder="Field name"
                        className="w-1/3"
                      />
                      <Input
                        value={cf.value}
                        onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCustomField(index)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label="Remove field"
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Generate Offer'}
                  </Button>
                </div>
              </form>
            </div>

            {/* SD Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Lock size={14} className="text-muted-foreground" /> Always disclosed</span>
              <span className="flex items-center gap-1"><LockOpen size={14} className="text-primary" /> Selectively disclosable</span>
            </div>
          </motion.div>
        )}

        {/* Step 3: QR Code */}
        {step === 3 && offerUri && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="bg-card rounded-2xl shadow-[var(--shadow-card)] p-8 w-full max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-center mb-2">Scan to Receive Credential</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Open TrustVault Wallet and scan this QR code
              </p>

              <QRDisplay value={offerUri} size={280} waiting />

              {expiresAt && <ExpiryCountdown expiresAt={expiresAt} />}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setOfferUri(null);
                  setExpiresAt(null);
                  setSelectedSchema(null);
                }}
              >
                Create Another
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
        <span>Offer expired. Create a new one.</span>
      ) : (
        <span>Expires in <span className="font-mono font-medium text-foreground">{remaining}</span></span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Claim Input Field                                                    */
/* ------------------------------------------------------------------ */

function ClaimInput({ claim, form }: { claim: ClaimDefinition; form: ReturnType<typeof useForm> }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium">
        <span>{claim.label}</span>
        {claim.required && <span className="text-destructive">*</span>}
        <span className="ml-auto" title={claim.selectivelyDisclosable ? 'Selectively disclosable' : 'Always disclosed'}>
          {claim.selectivelyDisclosable ? <LockOpen size={14} className="text-primary" /> : <Lock size={14} className="text-muted-foreground" />}
        </span>
      </label>
      <Input
        type={claim.type === 'date' ? 'date' : claim.type === 'number' ? 'number' : 'text'}
        step={claim.type === 'number' ? 'any' : undefined}
        {...form.register(claim.key)}
        className={form.formState.errors[claim.key] ? 'border-destructive' : ''}
        placeholder={`Enter ${claim.label.toLowerCase()}`}
      />
      {form.formState.errors[claim.key] && (
        <p className="text-destructive text-xs mt-1">
          {form.formState.errors[claim.key]?.message as string}
        </p>
      )}
    </div>
  );
}
