'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { GraduationCap, CurrencyDollar, IdentificationCard, Lock, LockOpen, Check } from '@phosphor-icons/react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { schemaTypeToAccent, getAccentStyles } from '@/lib/credential-styles';
import { Button } from '@/components/ui/button';
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
      { key: 'institutionName', label: 'Institution Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'degree', label: 'Degree', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'fieldOfStudy', label: 'Field of Study', type: 'string', required: true, selectivelyDisclosable: true },
      { key: 'graduationDate', label: 'Graduation Date', type: 'date', required: true, selectivelyDisclosable: true },
      { key: 'gpa', label: 'GPA', type: 'number', required: false, selectivelyDisclosable: true },
      { key: 'studentId', label: 'Student ID', type: 'string', required: false, selectivelyDisclosable: true },
    ],
  },
  {
    id: 'income',
    type: 'VerifiableIncomeCredential',
    name: 'Income Credential',
    description: 'Issue income and employment verification credentials.',
    claims: [
      { key: 'employerName', label: 'Employer Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'jobTitle', label: 'Job Title', type: 'string', required: true, selectivelyDisclosable: true },
      { key: 'annualIncome', label: 'Annual Income', type: 'number', required: true, selectivelyDisclosable: true },
      { key: 'currency', label: 'Currency', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'employmentStartDate', label: 'Employment Start Date', type: 'date', required: true, selectivelyDisclosable: true },
      { key: 'employeeId', label: 'Employee ID', type: 'string', required: false, selectivelyDisclosable: true },
    ],
  },
  {
    id: 'identity',
    type: 'VerifiableIdentityCredential',
    name: 'Identity Credential',
    description: 'Issue government-backed identity verification credentials.',
    claims: [
      { key: 'fullName', label: 'Full Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, selectivelyDisclosable: true },
      { key: 'nationality', label: 'Nationality', type: 'string', required: true, selectivelyDisclosable: true },
      { key: 'documentNumber', label: 'Document Number', type: 'string', required: true, selectivelyDisclosable: true },
      { key: 'address', label: 'Address', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'gender', label: 'Gender', type: 'string', required: false, selectivelyDisclosable: true },
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

  const currentClaims = selectedSchema?.claims ?? [];
  const zodSchema = buildZodSchema(currentClaims);
  type FormValues = z.infer<typeof zodSchema>;

  const form = useForm<FormValues>({
    resolver: zodResolver(zodSchema),
    defaultValues: currentClaims.reduce<Record<string, string>>((acc, c) => {
      acc[c.key] = '';
      return acc;
    }, {}),
  });

  const handleSchemaSelect = useCallback((schema: SchemaDefinition) => {
    setSelectedSchema(schema);
    form.reset(
      (schema.claims ?? []).reduce<Record<string, string>>((acc, c) => {
        acc[c.key] = '';
        return acc;
      }, {})
    );
  }, [form]);

  async function handleSubmit(values: FormValues) {
    if (!selectedSchema) return;

    setSubmitting(true);
    try {
      const response = await api.post<{ offerId: string; credentialOfferUri: string; preAuthorizedCode: string }>('/issuer/offers', {
        schemaTypeUri: selectedSchema.type,
        subjectDid: 'did:key:pending',
        claims: values,
      });
      setOfferUri(response.credentialOfferUri);
      setExpiresAt(new Date(Date.now() + 10 * 60 * 1000));
      setStep(3);
      toast.success('Credential offer created');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create offer';
      toast.error(message);
      // Demo fallback: generate a mock offer URI
      const mockUri = `openid-credential-offer://?credential_issuer=https://trustvault.dev&credential_type=${selectedSchema.type}&pre-authorized_code=${crypto.randomUUID()}`;
      setOfferUri(mockUri);
      setExpiresAt(new Date(Date.now() + 5 * 60 * 1000));
      setStep(3);
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
            {schemas.map((schema) => {
              const accentKey = schemaTypeToAccent[schema.type] ?? 'primary';
              const styles = getAccentStyles(accentKey);
              const icon = schemaIcons[schema.type];
              const isSelected = selectedSchema?.type === schema.type;

              return (
                <button
                  key={schema.id}
                  onClick={() => handleSchemaSelect(schema)}
                  className={cn(
                    'w-full text-left bg-card border rounded-xl p-5 transition-all',
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
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getAccentStyles(schemaTypeToAccent[selectedSchema.type] ?? 'primary').iconBg)}>
                  {schemaIcons[selectedSchema.type]}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedSchema.name}</h3>
                  <p className="text-xs text-muted-foreground">Fill in the claim values below</p>
                </div>
              </div>

              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {currentClaims.map((claim) => (
                  <div key={claim.key}>
                    <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                      <span>{claim.label}</span>
                      {claim.required && <span className="text-destructive">*</span>}
                      <span className="ml-auto" title={claim.selectivelyDisclosable ? 'Selectively disclosable' : 'Always disclosed'}>
                        {claim.selectivelyDisclosable ? <LockOpen size={14} className="text-primary" /> : <Lock size={14} className="text-muted-foreground" />}
                      </span>
                    </label>
                    <input
                      type={claim.type === 'date' ? 'date' : claim.type === 'number' ? 'number' : 'text'}
                      step={claim.type === 'number' ? 'any' : undefined}
                      {...form.register(claim.key)}
                      className={cn(
                        'w-full bg-background border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all',
                        form.formState.errors[claim.key] ? 'border-destructive' : 'border-border'
                      )}
                      placeholder={`Enter ${claim.label.toLowerCase()}`}
                    />
                    {form.formState.errors[claim.key] && (
                      <p className="text-destructive text-xs mt-1">
                        {form.formState.errors[claim.key]?.message as string}
                      </p>
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-between pt-4 border-t border-border">
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
            <div className="bg-card border border-border rounded-xl p-8 w-full max-w-md mx-auto">
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
