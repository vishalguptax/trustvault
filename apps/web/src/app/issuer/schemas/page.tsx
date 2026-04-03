'use client';

import { motion } from 'motion/react';
import { GraduationCap, CurrencyDollar, IdentificationCard, LockOpen, Lock } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { schemaTypeToAccent, getAccentStyles } from '@/lib/credential-styles';
import { useSchemas, useIssuerAuthorization } from '@/hooks/use-issuer';
import { FALLBACK_SCHEMAS } from '@/lib/schema-fallbacks';

const schemaIcons: Record<string, React.ReactNode> = {
  VerifiableEducationCredential: <GraduationCap size={24} weight="duotone" />,
  VerifiableIncomeCredential: <CurrencyDollar size={24} weight="duotone" />,
  VerifiableIdentityCredential: <IdentificationCard size={24} weight="duotone" />,
};

export default function IssuerSchemasPage() {
  const { data: fetchedSchemas, isLoading: loading, error: queryError, refetch } = useSchemas();
  const { data: authorization } = useIssuerAuthorization();
  const error = queryError ? (queryError instanceof Error ? queryError.message : 'Failed to fetch schemas') : null;

  const schemas = fetchedSchemas && fetchedSchemas.length > 0 ? fetchedSchemas : FALLBACK_SCHEMAS;
  const authorizedTypes = authorization?.authorized ? authorization.credentialTypes : [];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Credential Schemas</h2>

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
                  'glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all relative',
                  isUnauthorized && 'opacity-50',
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
