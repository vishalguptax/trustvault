'use client';

import { motion } from 'motion/react';
import { GraduationCap, CurrencyDollar, IdentificationCard, LockOpen, Lock } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { schemaTypeToAccent, getAccentStyles } from '@/lib/credential-styles';
import { useTrustSchemas } from '@/hooks/use-trust';
import { FALLBACK_SCHEMAS } from '@/lib/schema-fallbacks';

function SchemaIcon({ schemaType }: { schemaType: string }) {
  switch (schemaType) {
    case 'VerifiableEducationCredential':
      return <GraduationCap size={28} weight="duotone" />;
    case 'VerifiableIncomeCredential':
      return <CurrencyDollar size={28} weight="duotone" />;
    default:
      return <IdentificationCard size={28} weight="duotone" />;
  }
}

export default function SchemaRegistryPage() {
  const { data: fetchedSchemas, isLoading: loading, error: queryError, refetch } = useTrustSchemas();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch schemas') : null;

  const schemas = fetchedSchemas && fetchedSchemas.length > 0 ? fetchedSchemas : FALLBACK_SCHEMAS;

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
          <Button variant="link" size="sm" className="text-warning flex-shrink-0 ml-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 animate-pulse">
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
            const accentKey = schemaTypeToAccent[schema.type] ?? 'primary';
            const styles = getAccentStyles(accentKey);
            const requiredCount = schema.claims.filter((c) => c.required).length;
            const sdCount = schema.claims.filter((c) => c.selectivelyDisclosable).length;

            return (
              <motion.div
                key={schema.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all"
              >
                <div className={cn('h-1.5', styles.bar)} />
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', styles.iconBg)}>
                      <SchemaIcon schemaType={schema.type} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold">{schema.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono truncate">{schema.type}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{schema.description}</p>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{schema.claims.length} claims</Badge>
                    <Badge variant="destructive" className="bg-destructive/10 text-destructive border-0">{requiredCount} required</Badge>
                    <Badge className="bg-primary/10 text-primary border-0">{sdCount} SD</Badge>
                  </div>

                  <div className="space-y-1.5">
                    {schema.claims.map((claim) => (
                      <div
                        key={claim.key}
                        className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{claim.label}</span>
                          {claim.required && (
                            <Badge variant="destructive" className="text-[11px] px-1 py-0 h-4">REQ</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
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
