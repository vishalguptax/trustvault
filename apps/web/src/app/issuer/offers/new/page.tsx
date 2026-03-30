'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
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

function EducationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
      <path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87v48.42a15.91,15.91,0,0,0,4.06,10.65C49.16,191.53,78.51,216,128,216a130,130,0,0,0,48-8.76V130.67l16-8.53v40.58a8,8,0,0,0,16,0V116.53l43.76-23.47A8,8,0,0,0,251.76,88.94Z" />
    </svg>
  );
}

function IncomeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
      <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm12,152h-4v8a8,8,0,0,1-16,0v-8H104a8,8,0,0,1,0-16h36a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h16a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24a28,28,0,0,1,0,56Z" />
    </svg>
  );
}

function IdentityIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 256 256">
      <path d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24ZM96,48h64a8,8,0,0,1,0,16H96a8,8,0,0,1,0-16Zm84,168H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Zm0-48H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Zm0-48H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Z" />
    </svg>
  );
}

const schemaIcons: Record<string, React.ReactNode> = {
  education: <EducationIcon />,
  income: <IncomeIcon />,
  identity: <IdentityIcon />,
};

const schemaAccents: Record<string, string> = {
  education: 'credential-education',
  income: 'credential-income',
  identity: 'credential-identity',
};

/* ------------------------------------------------------------------ */
/* Lock / Unlock icons                                                 */
/* ------------------------------------------------------------------ */

function LockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" className="text-muted-foreground" aria-label="Always disclosed">
      <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80Zm-80,84a12,12,0,1,1,12-12A12,12,0,0,1,128,164Zm32-84H96V56a32,32,0,0,1,64,0Z" />
    </svg>
  );
}

function UnlockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" className="text-primary" aria-label="Selectively disclosable">
      <path d="M208,80H96V56a32,32,0,0,1,32-32c15.37,0,29.2,11,32.16,25.59a8,8,0,0,0,15.68-3.18C171.32,24.15,151.2,8,128,8A48.05,48.05,0,0,0,80,56V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80Zm-80,84a12,12,0,1,1,12-12A12,12,0,0,1,128,164Z" />
    </svg>
  );
}

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
      schema.claims.reduce<Record<string, string>>((acc, c) => {
        acc[c.key] = '';
        return acc;
      }, {})
    );
  }, [form]);

  async function handleSubmit(values: FormValues) {
    if (!selectedSchema) return;

    setSubmitting(true);
    try {
      const response = await api.post<{ offerUri: string; expiresAt: string }>('/issuer/offers', {
        schemaType: selectedSchema.type,
        claims: values,
      });
      setOfferUri(response.offerUri);
      setExpiresAt(new Date(response.expiresAt));
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
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all',
                s === step && 'bg-primary text-primary-foreground',
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
              {s === 1 ? 'Select Schema' : s === 2 ? 'Fill Claims' : 'QR Code'}
            </span>
            {s < 3 && <div className="w-8 h-px bg-border" />}
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
              const accent = schemaAccents[schema.id] ?? 'primary';
              const icon = schemaIcons[schema.id];
              const isSelected = selectedSchema?.id === schema.id;

              return (
                <button
                  key={schema.id}
                  onClick={() => handleSchemaSelect(schema)}
                  className={cn(
                    'w-full text-left bg-card border rounded-xl p-5 transition-all',
                    isSelected
                      ? `border-${accent} ring-1 ring-${accent}/30`
                      : 'border-border hover:border-muted-foreground/30'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0', `bg-${accent}/10 text-${accent}`)}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{schema.name}</h3>
                        {isSelected && (
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', `bg-${accent}/10 text-${accent}`)}>
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{schema.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">{schema.claims.length} claims</p>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1',
                      isSelected ? `border-${accent}` : 'border-muted'
                    )}>
                      {isSelected && <div className={cn('w-2.5 h-2.5 rounded-full', `bg-${accent}`)} />}
                    </div>
                  </div>
                </button>
              );
            })}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => {
                  if (!selectedSchema) {
                    toast.error('Please select a schema');
                    return;
                  }
                  setStep(2);
                }}
                className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Continue
              </button>
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
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', `bg-${schemaAccents[selectedSchema.id]}/10 text-${schemaAccents[selectedSchema.id]}`)}>
                  {schemaIcons[selectedSchema.id]}
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
                        {claim.selectivelyDisclosable ? <UnlockIcon /> : <LockIcon />}
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
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-muted-foreground text-sm hover:text-foreground transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={cn(
                      'bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity',
                      submitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                    )}
                  >
                    {submitting ? 'Creating...' : 'Generate Offer'}
                  </button>
                </div>
              </form>
            </div>

            {/* SD Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><LockIcon /> Always disclosed</span>
              <span className="flex items-center gap-1"><UnlockIcon /> Selectively disclosable</span>
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

              <QRDisplay value={offerUri} size={280} />

              {expiresAt && <ExpiryCountdown expiresAt={expiresAt} />}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setStep(1);
                  setOfferUri(null);
                  setExpiresAt(null);
                  setSelectedSchema(null);
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
