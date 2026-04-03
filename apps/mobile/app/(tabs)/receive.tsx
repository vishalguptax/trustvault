import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { impactMedium, notifySuccess, notifyError } from '@/lib/haptics';
import { StepIndicator } from '@/components/step-indicator';
import { AnimatedCheck } from '@/components/animated-check';
import { useCredentialStore, StoredCredential } from '@/lib/store';
import { api } from '@/lib/api';
import { CREDENTIAL_TYPE_CONFIG, CREDENTIAL_CATEGORIES, getClaimLabel } from '@/lib/constants';
import { formatClaimValue } from '@/lib/format';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { TABS, API } from '@/lib/routes';
import { useAuth } from '@/lib/auth/auth-context';

type ReceiveStep = 'loading' | 'preview' | 'confirming' | 'success' | 'error';

interface OfferPreview {
  issuerName: string | null;
  issuerDid: string;
  credentialType: string;
  credentialTypeName: string;
  documentName: string | null;
  claims: string[];
  claimValues: Record<string, unknown>;
}

/** Backend response from POST /wallet/credentials/receive */
interface ReceivedCredentialApi {
  credentialId: string;
  type: string;
  issuerDid: string;
  claims: Record<string, unknown>;
  issuedAt: string;
  typeName?: string;
  issuerName?: string;
  subjectDid?: string;
  status?: string;
  sdClaims?: string[];
  expiresAt?: string;
  rawCredential?: string;
}

interface ParsedOffer {
  credentialIssuer: string;
  credentialType: string;
  preAuthorizedCode: string;
}

function parseOfferUri(uri: string): ParsedOffer | null {
  try {
    const url = new URL(uri);
    const offerParam = url.searchParams.get('credential_offer');
    if (!offerParam) return null;

    const offer = JSON.parse(offerParam) as {
      credential_issuer: string;
      credential_configuration_ids: string[];
      grants: {
        'urn:ietf:params:oauth:grant-type:pre-authorized_code': {
          'pre-authorized_code': string;
        };
      };
    };

    return {
      credentialIssuer: offer.credential_issuer,
      credentialType: offer.credential_configuration_ids[0],
      preAuthorizedCode: offer.grants['urn:ietf:params:oauth:grant-type:pre-authorized_code']['pre-authorized_code'],
    };
  } catch {
    return null;
  }
}

function getCategoryIcon(type: string): keyof typeof Ionicons.glyphMap {
  const cat = CREDENTIAL_CATEGORIES.find((c) => c.type === type);
  return cat?.icon ?? 'document-outline';
}

export default function ReceiveScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const shadow = isDark ? cardShadowDark : cardShadow;
  const { user } = useAuth();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const addCredential = useCredentialStore((state) => state.addCredential);
  const [step, setStep] = useState<ReceiveStep>('loading');
  const [offer, setOffer] = useState<OfferPreview | null>(null);
  const [parsedOffer, setParsedOffer] = useState<ParsedOffer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const stepIndex =
    step === 'loading' || step === 'preview'
      ? 0
      : step === 'confirming'
        ? 1
        : step === 'error'
          ? 1
          : 2;

  useEffect(() => {
    if (!uri) {
      setErrorMessage('No credential offer URI provided.');
      setStep('error');
      return;
    }

    const parsed = parseOfferUri(uri);
    if (!parsed) {
      setErrorMessage('Invalid credential offer URI.');
      setStep('error');
      return;
    }
    setParsedOffer(parsed);

    let cancelled = false;
    (async () => {
      try {
        // Fetch rich preview from backend using the pre-authorized code
        const preview = await api.get<OfferPreview>(
          API.ISSUER.OFFER_PREVIEW(parsed.preAuthorizedCode),
        );
        if (cancelled) return;
        setOffer(preview);
        setStep('preview');
      } catch {
        if (cancelled) return;
        // Fallback: use basic info from the URI
        const typeConfig =
          CREDENTIAL_TYPE_CONFIG[parsed.credentialType as keyof typeof CREDENTIAL_TYPE_CONFIG];
        setOffer({
          issuerName: null,
          issuerDid: '',
          credentialType: parsed.credentialType,
          credentialTypeName: typeConfig?.name ?? parsed.credentialType,
          documentName: null,
          claims: [],
          claimValues: {},
        });
        setStep('preview');
      }
    })();
    return () => { cancelled = true; };
  }, [uri]);

  const handleAccept = useCallback(async () => {
    if (!uri) return;
    impactMedium();
    setStep('confirming');

    try {
      const result = await api.post<ReceivedCredentialApi>(
        API.WALLET.RECEIVE,
        {
          credentialOfferUri: uri,
          holderId: user?.id ?? '',
        },
      );

      const credType = result.type ?? offer?.credentialType ?? 'VerifiableCredential';
      const typeConfig =
        CREDENTIAL_TYPE_CONFIG[credType as keyof typeof CREDENTIAL_TYPE_CONFIG];

      const stored: StoredCredential = {
        id: result.credentialId ?? (result as unknown as Record<string, string>).id ?? '',
        type: credType,
        typeName: result.typeName ?? typeConfig?.name ?? credType,
        issuerDid: result.issuerDid ?? '',
        issuerName: result.issuerName ?? offer?.issuerName ?? null,
        subjectDid: result.subjectDid ?? (result.claims?.sub as string) ?? '',
        status: (result.status as StoredCredential['status']) ?? 'active',
        claims: result.claims ?? {},
        sdClaims: result.sdClaims ?? [],
        issuedAt: result.issuedAt ?? new Date().toISOString(),
        expiresAt: result.expiresAt,
        rawSdJwt: result.rawCredential,
      };

      addCredential(stored);
      notifySuccess();
      setStep('success');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to receive credential';
      setErrorMessage(message);
      notifyError();
      setStep('error');
    }
  }, [uri, user, offer, addCredential]);

  const accentColor =
    offer?.credentialType
      ? CREDENTIAL_TYPE_CONFIG[offer.credentialType as keyof typeof CREDENTIAL_TYPE_CONFIG]?.accent ?? colors.primary
      : colors.primary;
  const icon = offer ? getCategoryIcon(offer.credentialType) : 'document-outline';

  // Filter out internal/system claim keys for display
  const displayClaimEntries = offer
    ? Object.entries(offer.claimValues).filter(
        ([k]) => !['subjectDid', 'documentName'].includes(k),
      )
    : [];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <StepIndicator
        steps={['Preview', 'Confirm', 'Done']}
        currentStep={stepIndex}
      />

      {step === 'loading' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedText, fontSize: 14, marginTop: 12 }}>
            Resolving credential offer...
          </Text>
        </View>
      )}

      {step === 'preview' && offer && (
        <View style={{ marginTop: 20 }}>
          {/* Main offer card */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
            marginBottom: 18,
            ...shadow,
          }}>
            {/* Accent bar */}
            <View style={{ height: 3, backgroundColor: accentColor }} />

            <View style={{ padding: 18 }}>
              {/* Header: icon + type + document name */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: `${accentColor}14`,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Ionicons name={icon} size={22} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  {offer.documentName ? (
                    <>
                      <Text
                        style={{ color: colors.foreground, fontSize: 17, fontWeight: '700', lineHeight: 22 }}
                        numberOfLines={2}
                      >
                        {offer.documentName}
                      </Text>
                      <Text style={{ color: accentColor, fontSize: 12, fontWeight: '600', marginTop: 3 }}>
                        {offer.credentialTypeName}
                      </Text>
                    </>
                  ) : (
                    <Text
                      style={{ color: colors.foreground, fontSize: 17, fontWeight: '700', lineHeight: 22 }}
                      numberOfLines={2}
                    >
                      {offer.credentialTypeName}
                    </Text>
                  )}
                </View>
              </View>

              {/* Issuer */}
              <View style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 12,
                marginBottom: 14,
              }}>
                <Text style={{
                  color: colors.mutedText, fontSize: 10, fontWeight: '600',
                  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
                }}>
                  Issued by
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="shield-checkmark-outline" size={14} color={colors.mutedText} style={{ marginRight: 8 }} />
                  <Text
                    style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', flex: 1 }}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {offer.issuerName ?? offer.issuerDid ?? 'Unknown Issuer'}
                  </Text>
                </View>
              </View>

              {/* Claims preview */}
              {displayClaimEntries.length > 0 && (
                <View style={{
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  padding: 12,
                }}>
                  <Text style={{
                    color: colors.mutedText, fontSize: 10, fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
                  }}>
                    Included Claims
                  </Text>
                  <View style={{ gap: 8 }}>
                    {displayClaimEntries.map(([key, value]) => (
                      <View key={key} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                        <Text
                          style={{ color: colors.mutedText, fontSize: 13, width: '42%' }}
                          numberOfLines={1}
                        >
                          {getClaimLabel(key)}
                        </Text>
                        <Text
                          style={{ color: colors.foreground, fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right' }}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {formatClaimValue(value)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Claim keys only fallback (when claimValues is empty but claim names exist) */}
              {displayClaimEntries.length === 0 && offer.claims.length > 0 && (
                <View style={{
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  padding: 12,
                }}>
                  <Text style={{
                    color: colors.mutedText, fontSize: 10, fontWeight: '600',
                    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10,
                  }}>
                    Included Claims
                  </Text>
                  {offer.claims.map((claim) => (
                    <View key={claim} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <View style={{
                        width: 5, height: 5, borderRadius: 2.5,
                        backgroundColor: accentColor, marginRight: 10,
                      }} />
                      <Text style={{ color: colors.foreground, fontSize: 13 }}>
                        {getClaimLabel(claim)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* Info banner */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: `${colors.info}10`,
            borderRadius: 12, padding: 12,
            marginBottom: 18, gap: 10,
          }}>
            <Ionicons name="information-circle-outline" size={18} color={colors.info} />
            <Text style={{ color: colors.mutedText, fontSize: 12, flex: 1, lineHeight: 17 }}>
              This credential will be securely stored in your wallet. You control who can see it.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => { impactMedium(); router.back(); }}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.muted,
                opacity: pressed ? 0.85 : 1,
                paddingVertical: 15,
                borderRadius: 16,
                alignItems: 'center',
                minHeight: 50,
                justifyContent: 'center',
              })}
              accessibilityLabel="Decline credential offer"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }}>
                Decline
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              style={({ pressed }) => ({
                flex: 1.4,
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                paddingVertical: 15,
                borderRadius: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
                minHeight: 50,
              })}
              accessibilityLabel="Accept credential offer"
              accessibilityRole="button"
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.primaryFg} />
              <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 15 }}>
                Accept
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 'confirming' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{
            color: colors.foreground, fontSize: 18, fontWeight: '600', marginTop: 16,
          }}>
            Receiving credential...
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 14, marginTop: 8 }}>
            Communicating with issuer
          </Text>
        </View>
      )}

      {step === 'success' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <AnimatedCheck type="success" size={80} />
          <Text style={{
            color: colors.foreground, fontSize: 22, fontWeight: '700',
            marginTop: 20, marginBottom: 8,
          }}>
            Credential Received
          </Text>
          <Text style={{
            color: colors.mutedText, fontSize: 14, textAlign: 'center',
            marginBottom: 32, paddingHorizontal: 16,
          }}>
            The credential has been securely stored in your wallet.
          </Text>
          <Pressable
            onPress={() => router.replace(TABS.HOME)}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 14,
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
            })}
            accessibilityLabel="Return to wallet"
            accessibilityRole="button"
          >
            <Ionicons name="wallet-outline" size={18} color={colors.primaryFg} />
            <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 15 }}>
              View in Wallet
            </Text>
          </Pressable>
        </View>
      )}

      {step === 'error' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <AnimatedCheck type="error" size={80} />
          <Text style={{
            color: colors.foreground, fontSize: 20, fontWeight: '700',
            marginTop: 20, marginBottom: 8,
          }}>
            Failed to Receive
          </Text>
          <Text style={{
            color: colors.mutedText, fontSize: 14, textAlign: 'center',
            marginBottom: 32, paddingHorizontal: 16,
          }}>
            {errorMessage}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => router.replace(TABS.HOME)}
              style={({ pressed }) => ({
                backgroundColor: colors.muted,
                opacity: pressed ? 0.85 : 1,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                minHeight: 44,
              })}
              accessibilityLabel="Return to wallet"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.foreground, fontWeight: '500' }}>
                Back to Wallet
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (!uri || !parsedOffer) return;
                setStep('loading');
                setErrorMessage('');
                (async () => {
                  try {
                    const preview = await api.get<OfferPreview>(
                      API.ISSUER.OFFER_PREVIEW(parsedOffer.preAuthorizedCode),
                    );
                    setOffer(preview);
                    setStep('preview');
                  } catch {
                    setErrorMessage('Could not resolve credential offer.');
                    setStep('error');
                  }
                })();
              }}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                minHeight: 44,
              })}
              accessibilityLabel="Retry receiving credential"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.primaryFg, fontWeight: '700' }}>Retry</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
