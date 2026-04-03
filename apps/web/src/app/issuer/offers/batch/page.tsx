'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import {
  GraduationCap, CurrencyDollar, IdentificationCard, Check,
  UploadSimple, Table, PaperPlaneTilt, DownloadSimple, Trash, Copy,
} from '@phosphor-icons/react';
import { api } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import { schemaTypeToAccent, getAccentStyles } from '@/lib/credential-styles';
import { Button } from '@/components/ui/button';
import { FALLBACK_SCHEMAS } from '@/lib/schema-fallbacks';
import { useSchemas, useIssuerAuthorization } from '@/hooks/use-issuer';
import type { Schema } from '@/lib/api/issuer';

type SchemaDefinition = Schema;

const schemaIcons: Record<string, React.ReactNode> = {
  VerifiableEducationCredential: <GraduationCap size={32} weight="duotone" />,
  VerifiableIncomeCredential: <CurrencyDollar size={32} weight="duotone" />,
  VerifiableIdentityCredential: <IdentificationCard size={32} weight="duotone" />,
};

/* ------------------------------------------------------------------ */
/* CSV Parser                                                          */
/* ------------------------------------------------------------------ */

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] ?? '';
    });
    return row;
  });
}

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  results: Array<{
    offerId?: string;
    credentialOfferUri?: string;
    error?: string;
  }>;
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function BulkIssuePage() {
  const [step, setStep] = useState(1);
  const [selectedSchema, setSelectedSchema] = useState<SchemaDefinition | null>(null);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [csvText, setCsvText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<BatchResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: fetchedSchemas } = useSchemas();
  const { data: authorization } = useIssuerAuthorization();

  const schemas = fetchedSchemas && fetchedSchemas.length > 0 ? fetchedSchemas : FALLBACK_SCHEMAS;
  const authorizedTypes = authorization?.authorized ? authorization.credentialTypes : [];

  const displaySchemas = authorizedTypes.length > 0
    ? schemas.filter((s) => authorizedTypes.includes(s.type))
    : schemas;

  const requiredKeys = selectedSchema?.claims.filter((c) => c.required).map((c) => c.key) ?? [];

  function validateRow(row: Record<string, string>): boolean {
    return requiredKeys.every((key) => row[key] && row[key].trim() !== '');
  }

  const validRows = parsedRows.filter(validateRow);
  const invalidRows = parsedRows.filter((r) => !validateRow(r));

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      const rows = parseCSV(text);
      setParsedRows(rows);
      if (rows.length === 0) {
        toast.error('No data rows found in CSV');
      } else {
        toast.success(`Parsed ${rows.length} row${rows.length !== 1 ? 's' : ''}`);
      }
    };
    reader.readAsText(file);
  }

  function handlePasteCSV() {
    const rows = parseCSV(csvText);
    setParsedRows(rows);
    if (rows.length === 0) {
      toast.error('No data rows found. Ensure CSV has a header row and at least one data row.');
    } else {
      toast.success(`Parsed ${rows.length} row${rows.length !== 1 ? 's' : ''}`);
    }
  }

  function removeRow(index: number) {
    setParsedRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!selectedSchema) return;
    setSubmitting(true);

    try {
      const response = await api.post<BatchResult>('/issuer/offers/batch', {
        schemaTypeUri: selectedSchema.type,
        offers: validRows.map((claims) => ({ claims })),
      });
      setResults(response);
      setStep(4);
      toast.success(`Batch complete: ${response.successful} successful, ${response.failed} failed`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Batch issuance failed';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  function downloadResultsCSV() {
    if (!results) return;
    const header = 'offerId,credentialOfferUri,error';
    const rows = results.results.map((r) =>
      `${r.offerId ?? ''},${r.credentialOfferUri ?? ''},${r.error ?? ''}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'batch-offers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const stepLabels = ['Select Schema', 'Upload CSV', 'Preview', 'Results'];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Bulk Issue Credentials</h2>
      <p className="text-muted-foreground text-sm mb-8">
        Select a schema, upload a CSV of claim data, and issue credentials in bulk.
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
                    s === step && 'bg-primary text-primary-foreground',
                    s < step && 'bg-success text-white',
                    s > step && 'bg-muted text-muted-foreground'
                  )}
                >
                  {s < step ? <Check size={14} /> : s}
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
                  onClick={() => setSelectedSchema(schema)}
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

        {/* Step 2: Upload CSV */}
        {step === 2 && selectedSchema && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', getAccentStyles(schemaTypeToAccent[selectedSchema.type] ?? 'primary').iconBg)}>
                  {schemaIcons[selectedSchema.type]}
                </div>
                <div>
                  <h3 className="font-semibold">{selectedSchema.name}</h3>
                  <p className="text-xs text-muted-foreground">Upload or paste CSV data</p>
                </div>
              </div>

              {/* CSV format hint */}
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs font-medium text-muted-foreground mb-1">Expected CSV format (header row):</p>
                <code className="text-xs text-foreground font-mono break-all">
                  {selectedSchema.claims.map((c) => c.key).join(',')}
                </code>
                <p className="text-xs text-muted-foreground mt-2">
                  Required fields: {selectedSchema.claims.filter((c) => c.required).map((c) => c.label).join(', ')}
                </p>
              </div>

              {/* File upload */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Upload CSV file</label>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadSimple size={32} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to select a .csv file</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* Or paste */}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Or paste CSV data</label>
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-y"
                  placeholder={`${selectedSchema.claims.map((c) => c.key).join(',')}\nvalue1,value2,...`}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handlePasteCSV}
                >
                  Parse CSV
                </Button>
              </div>

              {parsedRows.length > 0 && (
                <div className="bg-success/10 border border-success/20 rounded-xl p-3">
                  <p className="text-sm text-success font-medium">
                    {parsedRows.length} row{parsedRows.length !== 1 ? 's' : ''} parsed successfully
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={() => {
                  if (parsedRows.length === 0) {
                    toast.error('Upload or paste CSV data first');
                    return;
                  }
                  setStep(3);
                }}
              >
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Preview & Validate */}
        {step === 3 && selectedSchema && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Table size={20} className="text-muted-foreground" />
                  <h3 className="font-semibold">Preview Data</h3>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-success font-medium">{validRows.length} valid</span>
                  {invalidRows.length > 0 && (
                    <span className="text-destructive font-medium">{invalidRows.length} invalid</span>
                  )}
                  <span className="text-muted-foreground">of {parsedRows.length} total</span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">#</th>
                      {selectedSchema.claims.map((claim) => (
                        <th key={claim.key} className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">
                          {claim.label}
                          {claim.required && <span className="text-destructive ml-0.5">*</span>}
                        </th>
                      ))}
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row, idx) => {
                      const isValid = validateRow(row);
                      return (
                        <tr
                          key={idx}
                          className={cn(
                            'border-t border-border',
                            !isValid && 'bg-destructive/5'
                          )}
                        >
                          <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                          {selectedSchema.claims.map((claim) => {
                            const value = row[claim.key] ?? '';
                            const isMissing = claim.required && value.trim() === '';
                            return (
                              <td
                                key={claim.key}
                                className={cn(
                                  'px-3 py-2 whitespace-nowrap',
                                  isMissing && 'text-destructive font-medium'
                                )}
                              >
                                {value || (isMissing ? 'Missing' : '-')}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2">
                            <button
                              onClick={() => removeRow(idx)}
                              className="text-muted-foreground hover:text-destructive transition-colors"
                              title="Remove row"
                            >
                              <Trash size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {invalidRows.length > 0 && (
                <div className="mt-4 bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  <p className="text-sm text-destructive font-medium">
                    {invalidRows.length} row{invalidRows.length !== 1 ? 's have' : ' has'} missing required fields. Only valid rows will be submitted.
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-6">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || validRows.length === 0}
              >
                {submitting
                  ? `Submitting ${validRows.length} offer${validRows.length !== 1 ? 's' : ''}...`
                  : `Issue ${validRows.length} Credential${validRows.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Results */}
        {step === 4 && results && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="glass-card rounded-2xl p-8 w-full max-w-2xl mx-auto">
              {/* Summary */}
              <div className="text-center mb-6">
                <div className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4',
                  results.failed === 0 ? 'bg-success/10' : 'bg-warning/10'
                )}>
                  {results.failed === 0 ? (
                    <Check size={32} className="text-success" weight="bold" />
                  ) : (
                    <PaperPlaneTilt size={32} className="text-warning" weight="bold" />
                  )}
                </div>
                <h3 className="text-xl font-bold mb-1">Batch Complete</h3>
                <p className="text-sm text-muted-foreground">
                  {results.successful} successful, {results.failed} failed out of {results.total} total
                </p>
              </div>

              {/* Offer URIs */}
              {results.results.some((r) => r.credentialOfferUri) && (
                <div className="space-y-2 mb-6">
                  <h4 className="text-sm font-medium">Credential Offer URIs</h4>
                  <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl border border-border p-3">
                    {results.results.map((r, idx) => (
                      <div key={idx} className={cn(
                        'flex items-center gap-2 text-xs font-mono rounded-lg px-2 py-1.5',
                        r.error ? 'bg-destructive/5 text-destructive' : 'bg-muted/50'
                      )}>
                        <span className="text-muted-foreground w-6 flex-shrink-0">{idx + 1}</span>
                        {r.credentialOfferUri ? (
                          <>
                            <span className="truncate flex-1">{r.credentialOfferUri}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(r.credentialOfferUri!);
                                toast.success('URI copied');
                              }}
                              className="text-muted-foreground hover:text-foreground flex-shrink-0"
                            >
                              <Copy size={14} />
                            </button>
                          </>
                        ) : (
                          <span className="truncate flex-1">{r.error ?? 'Failed'}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={downloadResultsCSV}>
                  <DownloadSimple size={16} className="mr-1.5" /> Download as CSV
                </Button>
                <Button
                  onClick={() => {
                    setStep(1);
                    setSelectedSchema(null);
                    setParsedRows([]);
                    setCsvText('');
                    setResults(null);
                  }}
                >
                  Issue Another Batch
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
