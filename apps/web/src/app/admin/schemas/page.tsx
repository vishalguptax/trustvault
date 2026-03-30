'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

interface ClaimDefinition {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  selectivelyDisclosable: boolean;
}

interface Schema {
  id: string;
  type: string;
  name: string;
  description: string;
  claims: ClaimDefinition[];
}

const FALLBACK_SCHEMAS: Schema[] = [
  {
    id: 'education',
    type: 'VerifiableEducationCredential',
    name: 'Education Credential',
    description: 'Academic credentials such as degrees, diplomas, and certificates. Used by educational institutions to issue verifiable proof of academic achievement.',
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
    description: 'Employment and income verification credentials. Used by employers and financial institutions to certify employment status and earnings.',
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
    description: 'Government-backed identity verification credentials. Used for KYC and identity proofing across various services.',
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

const schemaAccents: Record<string, string> = {
  education: 'credential-education',
  income: 'credential-income',
  identity: 'credential-identity',
};

function SchemaIcon({ schemaId }: { schemaId: string }) {
  switch (schemaId) {
    case 'education':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
          <path d="M251.76,88.94l-120-64a8,8,0,0,0-7.52,0l-120,64a8,8,0,0,0,0,14.12L32,117.87v48.42a15.91,15.91,0,0,0,4.06,10.65C49.16,191.53,78.51,216,128,216a130,130,0,0,0,48-8.76V130.67l16-8.53v40.58a8,8,0,0,0,16,0V116.53l43.76-23.47A8,8,0,0,0,251.76,88.94Z" />
        </svg>
      );
    case 'income':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm12,152h-4v8a8,8,0,0,1-16,0v-8H104a8,8,0,0,1,0-16h36a12,12,0,0,0,0-24H116a28,28,0,0,1,0-56h4V72a8,8,0,0,1,16,0v8h16a8,8,0,0,1,0,16H116a12,12,0,0,0,0,24h24a28,28,0,0,1,0,56Z" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="currentColor" viewBox="0 0 256 256">
          <path d="M200,24H56A16,16,0,0,0,40,40V216a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V40A16,16,0,0,0,200,24ZM96,48h64a8,8,0,0,1,0,16H96a8,8,0,0,1,0-16Zm84,168H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Zm0-48H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Zm0-48H76a8,8,0,0,1,0-16H180a8,8,0,0,1,0,16Z" />
        </svg>
      );
  }
}

export default function SchemaRegistryPage() {
  const [schemas, setSchemas] = useState<Schema[]>(FALLBACK_SCHEMAS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchSchemas() {
    setLoading(true);
    try {
      const data = await api.get<Schema[]>('/trust/schemas');
      if (data && data.length > 0) {
        setSchemas(data);
      }
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch schemas';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSchemas();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Schema Registry</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Credential schemas define the structure and claim definitions for each credential type.
      </p>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}. Showing default schemas.</p>
          </div>
          <button
            onClick={fetchSchemas}
            className="text-warning text-xs font-medium hover:underline flex-shrink-0 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-muted rounded-lg" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-8 bg-muted/50 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {schemas.map((schema, index) => {
            const accent = schemaAccents[schema.id] ?? 'primary';
            const requiredCount = schema.claims.filter((c) => c.required).length;
            const sdCount = schema.claims.filter((c) => c.selectivelyDisclosable).length;

            return (
              <motion.div
                key={schema.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-muted-foreground/30 transition-all"
              >
                <div className={cn('h-1.5', `bg-${accent}`)} />
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${accent}/10 text-${accent}`)}>
                      <SchemaIcon schemaId={schema.id} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{schema.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">{schema.type}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{schema.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 mb-4 text-xs">
                    <span className="bg-muted/50 px-2 py-1 rounded text-muted-foreground">
                      {schema.claims.length} claims
                    </span>
                    <span className="bg-destructive/10 px-2 py-1 rounded text-destructive">
                      {requiredCount} required
                    </span>
                    <span className="bg-primary/10 px-2 py-1 rounded text-primary">
                      {sdCount} SD
                    </span>
                  </div>

                  {/* Claims */}
                  <div className="space-y-1.5">
                    {schema.claims.map((claim) => (
                      <div
                        key={claim.key}
                        className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{claim.label}</span>
                          {claim.required && (
                            <span className="text-[9px] text-destructive font-bold">REQ</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded font-mono">
                            {claim.type}
                          </span>
                          {claim.selectivelyDisclosable ? (
                            <span className="text-primary" title="Selectively disclosable">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M208,80H96V56a32,32,0,0,1,32-32c15.37,0,29.2,11,32.16,25.59a8,8,0,0,0,15.68-3.18C171.32,24.15,151.2,8,128,8A48.05,48.05,0,0,0,80,56V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80Z" />
                              </svg>
                            </span>
                          ) : (
                            <span className="text-muted-foreground" title="Always disclosed">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 256 256">
                                <path d="M208,80H176V56a48,48,0,0,0-96,0V80H48A16,16,0,0,0,32,96V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V96A16,16,0,0,0,208,80ZM96,56a32,32,0,0,1,64,0V80H96Z" />
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
