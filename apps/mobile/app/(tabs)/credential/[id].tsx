import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useCredentialStore } from '@/lib/store';
import { StatusBadge } from '@/components/status-badge';
import { ClaimsList } from '@/components/claims-list';
import { IssuerBadge } from '@/components/issuer-badge';
import { QrDisplay } from '@/components/qr-display';
import { CREDENTIAL_TYPE_CONFIG } from '@/lib/constants';
import { api } from '@/lib/api';

interface ClaimsApiResponse {
  claims: Record<string, unknown>;
  sdClaims: string[];
}

export default function CredentialDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const credential = useCredentialStore((state) =>
    state.credentials.find((c) => c.id === id),
  );

  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [sdClaims, setSdClaims] = useState<string[] | null>(null);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [claimsError, setClaimsError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoadingClaims(true);

    api
      .get<ClaimsApiResponse>(`/wallet/credentials/${id}/claims`)
      .then((response) => {
        if (cancelled) return;
        setClaims(response.claims);
        setSdClaims(response.sdClaims);
      })
      .catch((err) => {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : 'Failed to load claims';
        setClaimsError(message);
      })
      .finally(() => {
        if (!cancelled) setLoadingClaims(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!credential) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#0B1120',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: '#6B7280' }}>Credential not found</Text>
      </View>
    );
  }

  const typeConfig =
    CREDENTIAL_TYPE_CONFIG[
      credential.type as keyof typeof CREDENTIAL_TYPE_CONFIG
    ];
  const accentColor = typeConfig?.accent ?? '#14B8A6';

  // Use API claims if available, fall back to store claims
  const displayClaims = claims ?? credential.claims;
  const displaySdClaims = sdClaims ?? credential.sdClaims;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B1120' }}
      contentContainerStyle={{ padding: 16 }}
    >
      {/* Header card */}
      <View
        style={{
          backgroundColor: '#111827',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: accentColor,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <Text
            style={{ color: '#F9FAFB', fontSize: 20, fontWeight: '700', flex: 1 }}
            numberOfLines={2}
          >
            {credential.typeName}
          </Text>
          <StatusBadge status={credential.status} />
        </View>

        <IssuerBadge
          issuerDid={credential.issuerDid}
          issuerName={credential.issuerName}
        />

        <View style={{ marginTop: 12 }}>
          <Text style={{ color: '#6B7280', fontSize: 12 }}>
            Issued: {new Date(credential.issuedAt).toLocaleDateString()}
          </Text>
          {credential.expiresAt ? (
            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
              Expires: {new Date(credential.expiresAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Claims section */}
      <View
        style={{
          backgroundColor: '#111827',
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            color: '#F9FAFB',
            fontSize: 17,
            fontWeight: '600',
            marginBottom: 12,
          }}
        >
          Claims
        </Text>

        {loadingClaims && !claims ? (
          <View style={{ alignItems: 'center', paddingVertical: 16 }}>
            <ActivityIndicator size="small" color="#14B8A6" />
            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 8 }}>
              Loading claims from server...
            </Text>
          </View>
        ) : claimsError && !claims ? (
          <View>
            <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 8 }}>
              Could not load latest claims: {claimsError}
            </Text>
            <ClaimsList claims={displayClaims} sdClaims={displaySdClaims} />
          </View>
        ) : (
          <ClaimsList claims={displayClaims} sdClaims={displaySdClaims} />
        )}
      </View>

      {/* QR display for sharing the credential subject DID */}
      {credential.subjectDid ? (
        <View
          style={{
            backgroundColor: '#111827',
            borderRadius: 16,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: '#F9FAFB',
              fontSize: 17,
              fontWeight: '600',
              marginBottom: 4,
            }}
          >
            Holder DID
          </Text>
          <Text
            style={{
              color: '#6B7280',
              fontSize: 12,
              marginBottom: 8,
              fontFamily: 'monospace',
            }}
            numberOfLines={2}
          >
            {credential.subjectDid}
          </Text>
          <QrDisplay
            value={credential.subjectDid}
            size={160}
            label="Scan to obtain this holder DID"
          />
        </View>
      ) : null}
    </ScrollView>
  );
}
