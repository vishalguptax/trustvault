import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCredentialStore } from '@/lib/store';
import { StatusBadge } from '@/components/status-badge';
import { ClaimsList } from '@/components/claims-list';
import { IssuerBadge } from '@/components/issuer-badge';
import { QrDisplay } from '@/components/qr-display';
import { CREDENTIAL_TYPE_CONFIG } from '@/lib/constants';
import { formatDate, truncateDid } from '@/lib/format';
import { useCredentialClaims } from '@/hooks/use-credentials';
import { useTheme } from '@/lib/theme';

export default function CredentialDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const credential = useCredentialStore((state) =>
    state.credentials.find((c) => c.id === id),
  );

  const { data: claimsData, isLoading: loadingClaims, error: claimsError } = useCredentialClaims(id ?? '');

  if (!credential) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.mutedText }}>Credential not found</Text>
      </View>
    );
  }

  const typeConfig =
    CREDENTIAL_TYPE_CONFIG[credential.type as keyof typeof CREDENTIAL_TYPE_CONFIG];
  const accentColor = typeConfig?.accent ?? colors.primary;

  const displayClaims = claimsData?.claims ?? credential.claims;
  const displaySdClaims = claimsData?.sdClaims ?? credential.sdClaims;
  
  const subjectDid = credential.subjectDid || (credential.claims?.sub as string) || '';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Header card */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          marginBottom: 16,
        }}
      >
        {/* Accent bar */}
        <View style={{ height: 4, backgroundColor: accentColor }} />
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text
              style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', flex: 1 }}
              numberOfLines={2}
            >
              {credential.typeName}
            </Text>
            <StatusBadge status={credential.status} />
          </View>

          <IssuerBadge issuerDid={credential.issuerDid} issuerName={credential.issuerName ?? ''} />

          <View style={{ marginTop: 12 }}>
            <Text style={{ color: colors.mutedText, fontSize: 12 }}>
              Issued: {formatDate(credential.issuedAt)}
            </Text>
            {credential.expiresAt ? (
              <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 2 }}>
                Expires: {formatDate(credential.expiresAt)}
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      {/* Claims section */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginBottom: 12 }}>
          Claims
        </Text>

        {loadingClaims && !claimsData ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 8 }}>
              Loading claims from server...
            </Text>
          </View>
        ) : claimsError && !claimsData ? (
          <View>
            <Text style={{ color: colors.mutedText, fontSize: 12, marginBottom: 8 }}>
              Could not load latest claims. Showing cached data.
            </Text>
            <ClaimsList claims={displayClaims} sdClaims={displaySdClaims} />
          </View>
        ) : (
          <ClaimsList claims={displayClaims} sdClaims={displaySdClaims} />
        )}
      </View>

      {/* QR display for sharing the credential subject DID */}
      {subjectDid && subjectDid !== 'unknown' ? (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '600', marginBottom: 4 }}>
            Holder DID
          </Text>
          <Text
            style={{ color: colors.mutedText, fontSize: 12, marginBottom: 8, fontFamily: 'monospace' }}
            numberOfLines={2}
          >
            {subjectDid}
          </Text>
          <QrDisplay value={subjectDid} size={160} label="Scan to obtain this holder DID" />
        </View>
      ) : null}
    </ScrollView>
  );
}
