'use client';

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, CurrencyDollar, IdentificationCard, LockOpen, Lock } from '@phosphor-icons/react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { schemaTypeToAccent, getAccentStyles } from '@/lib/credential-styles';

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
    description: 'Academic credentials such as degrees, diplomas, and certificates.',
    claims: [
      { key: 'documentName', label: 'Document Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'institutionName', label: 'Issuing Organization', type: 'string', required: true, selectivelyDisclosable: false },
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
    description: 'Income and employment verification credentials.',
    claims: [
      { key: 'documentName', label: 'Document Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'employerName', label: 'Issuing Organization', type: 'string', required: true, selectivelyDisclosable: false },
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
    description: 'Government-backed identity verification credentials.',
    claims: [
      { key: 'documentName', label: 'Document Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'fullName', label: 'Full Name', type: 'string', required: true, selectivelyDisclosable: false },
      { key: 'dateOfBirth', label: 'Date of Birth', type: 'date', required: true, selectivelyDisclosable: true },
      { key: 'nationality', label: 'Nationality', type: 'string', required: true, selectivelyDisclosable: true },
      { key: 'documentNumber', label: 'Document Number', type: 'string', required: true, selectivelyDisclosable: true },
      { key: 'address', label: 'Address', type: 'string', required: false, selectivelyDisclosable: true },
      { key: 'gender', label: 'Gender', type: 'string', required: false, selectivelyDisclosable: true },
    ],
  },
];

const schemaIcons: Record<string, React.ReactNode> = {
  VerifiableEducationCredential: <GraduationCap size={24} weight="duotone" />,
  VerifiableIncomeCredential: <CurrencyDollar size={24} weight="duotone" />,
  VerifiableIdentityCredential: <IdentificationCard size={24} weight="duotone" />,
};

export default function IssuerSchemasPage() {
  const [schemas, setSchemas] = useState<Schema[]>(FALLBACK_SCHEMAS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authorizedTypes, setAuthorizedTypes] = useState<string[]>([]);

  useEffect(() => {
    async function fetchAuthorization() {
      try {
        const result = await api.get<{ authorized: boolean; credentialTypes: string[] }>('/trust/issuers/me');
        if (result.authorized && result.credentialTypes.length > 0) {
          setAuthorizedTypes(result.credentialTypes);
        }
      } catch {
        // If fetch fails, show all schemas
      }
    }
    fetchAuthorization();
  }, []);

  async function fetchSchemas() {
    setLoading(true);
    try {
      const data = await api.get<Schema[]>('/issuer/schemas');
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
      <h2 className="text-2xl font-bold mb-6">Credential Schemas</h2>

      {error && (
        <div className="bg-warning/10 border border-warning/20 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-warning text-sm font-medium">API Unavailable</p>
            <p className="text-warning/70 text-xs mt-1">{error}. Showing default schemas.</p>
          </div>
          <Button variant="link" size="sm" className="text-warning flex-shrink-0 ml-4" onClick={fetchSchemas}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card rounded-2xl shadow-[var(--shadow-card)] p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="h-5 w-32 bg-muted rounded" />
              </div>
              <div className="h-4 w-48 bg-muted rounded mb-4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-3 bg-muted rounded w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {schemas.map((schema, index) => {
            const accentKey = schemaTypeToAccent[schema.type] ?? 'primary';
            const styles = getAccentStyles(accentKey);
            const icon = schemaIcons[schema.type];
            const isUnauthorized = authorizedTypes.length > 0 && !authorizedTypes.includes(schema.type);

            return (
              <motion.div
                key={schema.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  'bg-card rounded-2xl shadow-[var(--shadow-card)] overflow-hidden hover:shadow-lg transition-all relative',
                  isUnauthorized && 'opacity-50'
                )}
              >
                {isUnauthorized && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge variant="secondary" className="text-[11px] bg-muted text-muted-foreground">Not Authorized</Badge>
                  </div>
                )}
                <div className={cn('h-1', styles.bar)} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', styles.iconBg)}>
                      {icon}
                    </div>
                    <div>
                      <h3 className="font-semibold">{schema.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{schema.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{schema.description}</p>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Claims ({schema.claims.length})
                    </p>
                    {schema.claims.map((claim) => (
                      <div
                        key={claim.key}
                        className="flex items-center justify-between bg-muted/30 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{claim.label}</span>
                          {claim.required && (
                            <Badge variant="destructive" className="text-[11px] px-1 py-0 h-4">REQ</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[11px] uppercase px-1.5 py-0 h-4 font-mono">
                            {claim.type}
                          </Badge>
                          {claim.selectivelyDisclosable ? (
                            <LockOpen size={12} className="text-primary" aria-label="Selectively disclosable" />
                          ) : (
                            <Lock size={12} className="text-muted-foreground" aria-label="Always disclosed" />
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
