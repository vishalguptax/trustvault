import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { impactMedium, notifySuccess, notifyError, notifyWarning } from '@/lib/haptics';
import { StepIndicator } from '@/components/step-indicator';
import { AnimatedCheck } from '@/components/animated-check';
import { useCredentialStore, StoredCredential } from '@/lib/store';
import { api } from '@/lib/api';
import { CREDENTIAL_TYPE_CONFIG } from '@/lib/constants';

type ReceiveStep = 'loading' | 'preview' | 'confirming' | 'success' | 'error';

import { useAuth } from '@/lib/auth/auth-context';

interface OfferPreview {
  issuerName: string;
  issuerDid: string;
  credentialType: string;
  credentialTypeName: string;
  claims: string[];
}

interface ReceivedCredential {
  id: string;
  type: string;
  typeName: string;
  issuerDid: string;
  issuerName: string;
  subjectDid: string;
  status: 'active' | 'revoked' | 'suspended' | 'expired';
  claims: Record<string, unknown>;
  sdClaims: string[];
  issuedAt: string;
  expiresAt?: string;
  rawSdJwt?: string;
}

function parseOfferUri(uri: string): OfferPreview | null {
  try {
    const url = new URL(uri);
    const issuerName = url.searchParams.get('issuer_name') ?? 'Unknown Issuer';
    const issuerDid = url.searchParams.get('issuer_did') ?? '';
    const credentialType =
      url.searchParams.get('credential_type') ?? 'VerifiableCredential';

    const typeConfig =
      CREDENTIAL_TYPE_CONFIG[
        credentialType as keyof typeof CREDENTIAL_TYPE_CONFIG
      ];
    const credentialTypeName = typeConfig?.name ?? credentialType;

    const claimsParam = url.searchParams.get('claims');
    const claims = claimsParam ? claimsParam.split(',') : [];

    return {
      issuerName,
      issuerDid,
      credentialType,
      credentialTypeName,
      claims,
    };
  } catch {
    return null;
  }
}

export default function ReceiveScreen() {
  const router = useRouter();
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

    // Attempt to parse the URI for a preview
    const parsed = parseOfferUri(uri);
    if (parsed) {
      setOffer(parsed);
      setStep('preview');
    } else {
      // If the URI is not parseable locally, show a generic preview
      setOffer({
        issuerName: 'Credential Issuer',
        issuerDid: '',
        credentialType: 'VerifiableCredential',
        credentialTypeName: 'Verifiable Credential',
        claims: [],
      });
      setStep('preview');
    }
  }, [uri]);

  const handleAccept = useCallback(async () => {
    if (!uri) return;
    setStep('confirming');

    try {
      const result = await api.post<ReceivedCredential>(
        '/wallet/credentials/receive',
        {
          credentialOfferUri: uri,
          holderId: user?.id ?? '',
        },
      );

      const stored: StoredCredential = {
        id: result.id,
        type: result.type,
        typeName: result.typeName,
        issuerDid: result.issuerDid,
        issuerName: result.issuerName,
        subjectDid: result.subjectDid,
        status: result.status,
        claims: result.claims,
        sdClaims: result.sdClaims,
        issuedAt: result.issuedAt,
        expiresAt: result.expiresAt,
        rawSdJwt: result.rawSdJwt,
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
  }, [uri, addCredential]);

  const accentColor =
    offer?.credentialType &&
    CREDENTIAL_TYPE_CONFIG[
      offer.credentialType as keyof typeof CREDENTIAL_TYPE_CONFIG
    ]?.accent;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B1120' }}
      contentContainerStyle={{ padding: 16 }}
    >
      <StepIndicator
        steps={['Preview', 'Confirm', 'Done']}
        currentStep={stepIndex}
      />

      {step === 'loading' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 12 }}>
            Resolving credential offer...
          </Text>
        </View>
      )}

      {step === 'preview' && offer && (
        <View style={{ marginTop: 24 }}>
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
                fontSize: 18,
                fontWeight: '600',
                marginBottom: 8,
              }}
            >
              Credential Offer
            </Text>
            <Text
              style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}
            >
              An issuer wants to send you a credential.
            </Text>

            {/* Issuer */}
            <View
              style={{
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: '#6B7280',
                  fontSize: 11,
                  marginBottom: 4,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Issuer
              </Text>
              <Text style={{ color: '#F9FAFB', fontSize: 15, fontWeight: '500' }}>
                {offer.issuerName}
              </Text>
              {offer.issuerDid.length > 0 && (
                <Text
                  style={{
                    color: '#6B7280',
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
                backgroundColor: '#1F2937',
                borderRadius: 12,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: '#6B7280',
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
                    color: '#F9FAFB',
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
                  backgroundColor: '#1F2937',
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <Text
                  style={{
                    color: '#6B7280',
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
                        backgroundColor: '#14B8A6',
                        marginRight: 8,
                      }}
                    />
                    <Text
                      style={{
                        color: '#F9FAFB',
                        fontSize: 14,
                        textTransform: 'capitalize',
                      }}
                    >
                      {claim}
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
                backgroundColor: pressed ? '#374151' : '#1F2937',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              })}
              accessibilityLabel="Decline credential offer"
              accessibilityRole="button"
              accessibilityHint="Returns to the previous screen without receiving the credential"
            >
              <Text style={{ color: '#F9FAFB', fontWeight: '500', fontSize: 15 }}>
                Decline
              </Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: pressed ? '#0D9488' : '#14B8A6',
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: 'center',
              })}
              accessibilityLabel="Accept credential offer"
              accessibilityRole="button"
              accessibilityHint="Receives and stores the credential in your wallet"
            >
              <Text style={{ color: '#0B1120', fontWeight: '700', fontSize: 15 }}>
                Accept
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 'confirming' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text
            style={{
              color: '#F9FAFB',
              fontSize: 18,
              fontWeight: '600',
              marginTop: 16,
            }}
          >
            Receiving credential...
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>
            Communicating with issuer
          </Text>
        </View>
      )}

      {step === 'success' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <AnimatedCheck variant="success" size={80} />
          <Text
            style={{
              color: '#F9FAFB',
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
              color: '#6B7280',
              fontSize: 14,
              textAlign: 'center',
              marginBottom: 32,
              paddingHorizontal: 16,
            }}
          >
            The credential has been securely stored in your wallet.
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#0D9488' : '#14B8A6',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
            })}
            accessibilityLabel="Return to wallet"
            accessibilityRole="button"
          >
            <Text style={{ color: '#0B1120', fontWeight: '700', fontSize: 15 }}>
              View in Wallet
            </Text>
          </Pressable>
        </View>
      )}

      {step === 'error' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <AnimatedCheck variant="rejection" size={80} />
          <Text
            style={{
              color: '#F9FAFB',
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
              color: '#6B7280',
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
              onPress={() => router.replace('/')}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#374151' : '#1F2937',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
              })}
              accessibilityLabel="Return to wallet"
              accessibilityRole="button"
            >
              <Text style={{ color: '#F9FAFB', fontWeight: '500' }}>
                Back to Wallet
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setStep('loading');
                setErrorMessage('');
                const parsed = uri ? parseOfferUri(uri) : null;
                if (parsed) {
                  setOffer(parsed);
                  setStep('preview');
                } else {
                  setOffer({
                    issuerName: 'Credential Issuer',
                    issuerDid: '',
                    credentialType: 'VerifiableCredential',
                    credentialTypeName: 'Verifiable Credential',
                    claims: [],
                  });
                  setStep('preview');
                }
              }}
              style={({ pressed }) => ({
                backgroundColor: pressed ? '#0D9488' : '#14B8A6',
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
              })}
              accessibilityLabel="Retry receiving credential"
              accessibilityRole="button"
            >
              <Text style={{ color: '#0B1120', fontWeight: '700' }}>Retry</Text>
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
