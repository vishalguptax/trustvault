import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { impactMedium, notifySuccess, notifyError, notifyWarning } from '@/lib/haptics';
import { StepIndicator } from '@/components/step-indicator';
import { AnimatedCheck } from '@/components/animated-check';
import { useCredentialStore, StoredCredential } from '@/lib/store';
import { api } from '@/lib/api';
import { CREDENTIAL_TYPE_CONFIG, getClaimLabel } from '@/lib/constants';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { TABS, API } from '@/lib/routes';

type ReceiveStep = 'loading' | 'preview' | 'confirming' | 'success' | 'error';

import { useAuth } from '@/lib/auth/auth-context';

interface OfferPreview {
  issuerName: string;
  issuerDid: string;
  credentialType: string;
  credentialTypeName: string;
  claims: string[];
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
}

function parseOfferUri(uri: string): ParsedOffer | null {
  try {
    const url = new URL(uri);
    const offerParam = url.searchParams.get('credential_offer');
    if (!offerParam) return null;

    const offer = JSON.parse(offerParam) as {
      credential_issuer: string;
      credential_configuration_ids: string[];
    };

    return {
      credentialIssuer: offer.credential_issuer,
      credentialType: offer.credential_configuration_ids[0],
    };
  } catch {
    return null;
  }
}

async function fetchIssuerMetadata(credentialIssuer: string): Promise<{ issuerName: string; issuerDid: string }> {
  // The credential_issuer URL from the offer is something like http://host:8000/issuer
  // The metadata lives at {credential_issuer}/.well-known/openid-credential-issuer
  // which maps to our API path /issuer/.well-known/openid-credential-issuer
  const url = new URL(`${credentialIssuer}/.well-known/openid-credential-issuer`);
  const relativePath = url.pathname; // e.g., /issuer/.well-known/openid-credential-issuer

  const data = await api.get<{
    display?: Array<{ name: string }>;
    issuer_did?: string;
  }>(relativePath);

  const issuerName = data.display?.[0]?.name ?? credentialIssuer;
  const issuerDid = data.issuer_did ?? '';

  return { issuerName, issuerDid };
}

async function resolveOfferPreview(uri: string): Promise<OfferPreview | null> {
  const parsed = parseOfferUri(uri);
  if (!parsed) return null;

  const typeConfig =
    CREDENTIAL_TYPE_CONFIG[parsed.credentialType as keyof typeof CREDENTIAL_TYPE_CONFIG];

  let issuerName = parsed.credentialIssuer;
  let issuerDid = '';

  try {
    const meta = await fetchIssuerMetadata(parsed.credentialIssuer);
    issuerName = meta.issuerName;
    issuerDid = meta.issuerDid;
  } catch {
    // Metadata fetch failed — use credential_issuer URL as fallback
  }

  return {
    issuerName,
    issuerDid,
    credentialType: parsed.credentialType,
    credentialTypeName: typeConfig?.name ?? parsed.credentialType,
    claims: [],
  };
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

    let cancelled = false;
    (async () => {
      const preview = await resolveOfferPreview(uri);
      if (cancelled) return;
      if (preview) {
        setOffer(preview);
        setStep('preview');
      } else {
        setErrorMessage('Invalid credential offer URI.');
        setStep('error');
      }
    })();
    return () => { cancelled = true; };
  }, [uri]);

  const handleAccept = useCallback(async () => {
    if (!uri) return;
    setStep('confirming');

    try {
      const result = await api.post<ReceivedCredentialApi>(
        API.WALLET.RECEIVE,
        {
          credentialOfferUri: uri,
          holderId: user?.id ?? '',
        },
      );

      // Map backend response to StoredCredential, filling in missing fields
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
    offer?.credentialType &&
    CREDENTIAL_TYPE_CONFIG[
      offer.credentialType as keyof typeof CREDENTIAL_TYPE_CONFIG
    ]?.accent;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
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
        <View style={{ marginTop: 24 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 18,
              padding: 18,
              marginBottom: 18,
              ...shadow,
            }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Credential Offer
            </Text>
            <Text
              style={{ color: colors.mutedText, fontSize: 14, marginBottom: 16 }}
            >
              An issuer wants to send you a credential.
            </Text>

            {/* Issuer */}
            <View
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: colors.mutedText,
                  fontSize: 11,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Issuer
              </Text>
              <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '500' }}>
                {offer.issuerName}
              </Text>
              {offer.issuerDid.length > 0 && (
                <Text
                  style={{
                    color: colors.mutedText,
                    fontSize: 10,
                    fontFamily: 'monospace',
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {offer.issuerDid}
                </Text>
              )}
            </View>

            {/* Credential Type */}
            <View
              style={{
                backgroundColor: colors.muted,
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: colors.mutedText,
                  fontSize: 11,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Credential Type
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {accentColor ? (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: accentColor,
                      marginRight: 8,
                    }}
                  />
                ) : null}
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 15,
                    fontWeight: '500',
                  }}
                >
                  {offer.credentialTypeName}
                </Text>
              </View>
            </View>

            {/* Claims preview */}
            {offer.claims.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.muted,
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.mutedText,
                    fontSize: 11,
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Included Claims
                </Text>
                {offer.claims.map((claim) => (
                  <View
                    key={claim}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: colors.primary,
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        color: colors.foreground,
                        fontSize: 14,
                      }}
                    >
                      {getClaimLabel(claim)}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.muted,
                opacity: pressed ? 0.85 : 1,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                minHeight: 48,
              })}
              accessibilityLabel="Decline credential offer"
              accessibilityRole="button"
              accessibilityHint="Returns to the previous screen without receiving the credential"
            >
              <Text style={{ color: colors.foreground, fontWeight: '500', fontSize: 15 }}>
                Decline
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                paddingVertical: 14,
                borderRadius: 16,
                alignItems: 'center',
                minHeight: 48,
              })}
              accessibilityLabel="Accept credential offer"
              accessibilityRole="button"
              accessibilityHint="Receives and stores the credential in your wallet"
            >
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
          <Text
            style={{
              color: colors.foreground,
              fontSize: 18,
              fontWeight: '600',
              marginTop: 16,
            }}
          >
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
          <Text
            style={{
              color: colors.foreground,
              fontSize: 22,
              fontWeight: '700',
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            Credential Received
          </Text>
          <Text
            style={{
              color: colors.mutedText,
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 32,
              paddingHorizontal: 16,
            }}
          >
            The credential has been securely stored in your wallet.
          </Text>
          <Pressable
            onPress={() => router.replace(TABS.HOME)}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
              minHeight: 44,
            })}
            accessibilityLabel="Return to wallet"
            accessibilityRole="button"
          >
            <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 15 }}>
              View in Wallet
            </Text>
          </Pressable>
        </View>
      )}

      {step === 'error' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <AnimatedCheck type="error" size={80} />
          <Text
            style={{
              color: colors.foreground,
              fontSize: 20,
              fontWeight: '700',
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            Failed to Receive
          </Text>
          <Text
            style={{
              color: colors.mutedText,
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 32,
              paddingHorizontal: 16,
            }}
          >
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
              onPress={async () => {
                if (!uri) return;
                setStep('loading');
                setErrorMessage('');
                const preview = await resolveOfferPreview(uri);
                if (preview) {
                  setOffer(preview);
                  setStep('preview');
                } else {
                  setErrorMessage('Invalid credential offer URI.');
                  setStep('error');
                }
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
