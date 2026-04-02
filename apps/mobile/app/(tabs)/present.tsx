import { Ionicons } from '@expo/vector-icons';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { impactMedium, notifySuccess, notifyError, notifyWarning } from '@/lib/haptics';
import { StepIndicator } from '@/components/step-indicator';
import { AnimatedCheck } from '@/components/animated-check';
import { ConsentSheet } from '@/components/consent-sheet';
import { useCredentialStore, StoredCredential } from '@/lib/store';
import { api } from '@/lib/api';
import { CREDENTIAL_TYPE_CONFIG, getClaimLabel } from '@/lib/constants';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { TABS, API } from '@/lib/routes';

type PresentStep = 'loading' | 'select' | 'disclose' | 'consent' | 'submitting' | 'result' | 'error';

import { useAuth } from '@/lib/auth/auth-context';

interface VerificationRequest {
  id: string;
  verifierDid: string;
  verifierName: string;
  purpose: string;
  requiredCredentialTypes: string[];
  requiredClaims: Record<string, string[]>;
}

/** Backend response from POST /wallet/presentations/create */
interface PresentationResultApi {
  presentationId: string;
  vpToken: string;
  status: string;
  // Future fields when backend completes the verification flow
  verificationId?: string;
  result?: 'verified' | 'rejected';
  checks?: Record<string, boolean>;
}

function parseVerificationUri(uri: string): VerificationRequest | null {
  try {
    const url = new URL(uri);

    // Backend generates: openid4vp://?request_uri=<encoded>&nonce=<nonce>
    const requestUri = url.searchParams.get('request_uri') ?? '';
    const nonce = url.searchParams.get('nonce') ?? '';

    // Extract request ID from the request_uri path (e.g., .../presentations/<id>)
    const requestIdMatch = requestUri.match(/presentations\/([^/?]+)/);
    const requestId = requestIdMatch
      ? requestIdMatch[1]
      : url.searchParams.get('state') ?? '';

    // These may or may not be present depending on backend version
    const verifierDid = url.searchParams.get('verifier_did') ?? '';
    const verifierName = url.searchParams.get('verifier_name') ?? 'Verifier';
    const purpose = url.searchParams.get('purpose') ?? 'Identity verification';

    const typesParam = url.searchParams.get('credential_types');
    const requiredCredentialTypes = typesParam ? typesParam.split(',') : [];

    const claimsParam = url.searchParams.get('required_claims');
    let requiredClaims: Record<string, string[]> = {};
    if (claimsParam) {
      try {
        requiredClaims = JSON.parse(decodeURIComponent(claimsParam));
      } catch {
        requiredClaims = {};
      }
    }

    return {
      id: requestId,
      verifierDid,
      verifierName,
      purpose,
      requiredCredentialTypes,
      requiredClaims,
    };
  } catch {
    return null;
  }
}

export default function PresentScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const shadow = isDark ? cardShadowDark : cardShadow;
  const { user } = useAuth();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const credentials = useCredentialStore((state) => state.credentials);
  const addConsentRecord = useCredentialStore((state) => state.addConsentRecord);

  const [step, setStep] = useState<PresentStep>('loading');
  const [verificationRequest, setVerificationRequest] =
    useState<VerificationRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [disclosures, setDisclosures] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<'verified' | 'rejected' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConsentSheet, setShowConsentSheet] = useState(false);

  const stepIndex =
    step === 'loading' || step === 'select'
      ? 0
      : step === 'disclose'
        ? 1
        : step === 'consent'
          ? 2
          : step === 'submitting'
            ? 3
            : step === 'error'
              ? 3
              : 4;

  // Parse the verification request URI
  useEffect(() => {
    if (!uri) {
      setErrorMessage('No verification request URI provided.');
      setStep('error');
      return;
    }

    const parsed = parseVerificationUri(uri);
    if (parsed) {
      setVerificationRequest(parsed);
    } else {
      setVerificationRequest({
        id: '',
        verifierDid: '',
        verifierName: 'Verifier',
        purpose: 'Identity verification',
        requiredCredentialTypes: [],
        requiredClaims: {},
      });
    }
    setStep('select');
  }, [uri]);

  // Build required claims set for the selected credentials
  const requiredClaimKeys = useMemo(() => {
    if (!verificationRequest) return new Set<string>();
    const keys = new Set<string>();
    Object.values(verificationRequest.requiredClaims).forEach((claims) => {
      claims.forEach((c) => keys.add(c));
    });
    return keys;
  }, [verificationRequest]);

  // Get all SD claims from selected credentials
  const selectedCredentials = useMemo(
    () => credentials.filter((c) => selectedIds.includes(c.id)),
    [credentials, selectedIds],
  );

  const allDisclosableClaims = useMemo(() => {
    const claims: { key: string; credentialId: string; credentialType: string; required: boolean }[] = [];
    selectedCredentials.forEach((cred) => {
      cred.sdClaims.forEach((claim) => {
        claims.push({
          key: claim,
          credentialId: cred.id,
          credentialType: cred.typeName,
          required: requiredClaimKeys.has(claim),
        });
      });
      // Also include non-SD claims (always disclosed)
      Object.keys(cred.claims).forEach((claim) => {
        if (!cred.sdClaims.includes(claim)) {
          claims.push({
            key: claim,
            credentialId: cred.id,
            credentialType: cred.typeName,
            required: true,
          });
        }
      });
    });
    return claims;
  }, [selectedCredentials, requiredClaimKeys]);

  // Initialize disclosures when moving to disclose step
  useEffect(() => {
    if (step === 'disclose') {
      const initial: Record<string, boolean> = {};
      allDisclosableClaims.forEach((claim) => {
        initial[claim.key] = claim.required || (disclosures[claim.key] ?? true);
      });
      setDisclosures(initial);
    }
  }, [step, allDisclosableClaims]);

  const toggleCredential = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const toggleDisclosure = useCallback(
    (claim: string) => {
      if (requiredClaimKeys.has(claim)) return; // Cannot toggle required claims
      setDisclosures((prev) => ({ ...prev, [claim]: !prev[claim] }));
    },
    [requiredClaimKeys],
  );

  const disclosedClaimsList = useMemo(
    () =>
      Object.entries(disclosures)
        .filter(([, disclosed]) => disclosed)
        .map(([claim]) => claim),
    [disclosures],
  );

  // Build consent disclosure summary grouped by credential
  const consentDisclosures = useMemo(() => {
    const grouped: Record<string, string[]> = {};
    allDisclosableClaims.forEach((claim) => {
      if (disclosures[claim.key]) {
        if (!grouped[claim.credentialType]) {
          grouped[claim.credentialType] = [];
        }
        grouped[claim.credentialType].push(claim.key);
      }
    });
    return Object.entries(grouped).map(([credentialType, claims]) => ({
      credentialType,
      claims,
    }));
  }, [allDisclosableClaims, disclosures]);

  const handleShowConsent = useCallback(() => {
    setStep('consent');
    setShowConsentSheet(true);
  }, []);

  const handleConsentAllow = useCallback(async () => {
    setShowConsentSheet(false);
    setStep('submitting');

    try {
      // Build disclosed claims map per credential
      const disclosedClaimsMap: Record<string, string[]> = {};
      selectedCredentials.forEach((cred) => {
        const credDisclosed = Object.entries(disclosures)
          .filter(([key, val]) => val && (cred.sdClaims.includes(key) || key in cred.claims))
          .map(([key]) => key);
        disclosedClaimsMap[cred.id] = credDisclosed;
      });

      const response = await api.post<PresentationResultApi>(
        API.WALLET.CREATE_PRESENTATION,
        {
          verificationRequestId: verificationRequest?.id ?? '',
          holderId: user?.id ?? '',
          selectedCredentials: selectedIds,
          disclosedClaims: disclosedClaimsMap,
          consent: true,
        },
      );

      // Backend returns { presentationId, vpToken, status }
      // Map status to result: 'submitted' means presentation was accepted
      const verificationResult: 'verified' | 'rejected' =
        response.result ?? (response.status === 'submitted' ? 'verified' : 'rejected');

      setResult(verificationResult);
      if (verificationResult === 'verified') {
        notifySuccess();
      } else {
        notifyError();
      }

      addConsentRecord({
        id: response.verificationId ?? response.presentationId ?? '',
        verifierName: verificationRequest?.verifierName ?? 'Verifier',
        verifierDid: verificationRequest?.verifierDid ?? '',
        credentialIds: selectedIds,
        disclosedClaims: disclosedClaimsList,
        result: verificationResult,
        timestamp: new Date().toISOString(),
      });

      setStep('result');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create presentation';
      setErrorMessage(message);
      notifyError();
      setStep('error');
    }
  }, [
    selectedCredentials,
    disclosures,
    verificationRequest,
    selectedIds,
    disclosedClaimsList,
    addConsentRecord,
  ]);

  const handleConsentDeny = useCallback(() => {
    setShowConsentSheet(false);
    router.back();
  }, [router]);

  const getAccentColor = (type: string): string => {
    const config =
      CREDENTIAL_TYPE_CONFIG[type as keyof typeof CREDENTIAL_TYPE_CONFIG];
    return config?.accent ?? colors.primary;
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
    >
      <StepIndicator
        steps={['Select', 'Disclose', 'Consent', 'Submit', 'Result']}
        currentStep={stepIndex}
      />

      {step === 'loading' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedText, fontSize: 14, marginTop: 12 }}>
            Loading verification request...
          </Text>
        </View>
      )}

      {step === 'select' && (
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Select Credentials
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 14, marginBottom: 16 }}>
            {verificationRequest?.requiredCredentialTypes.length
              ? `The verifier requests: ${verificationRequest.requiredCredentialTypes.join(', ')}`
              : 'Choose which credentials to present to the verifier.'}
          </Text>

          {credentials.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: colors.mutedText, fontSize: 14, textAlign: 'center' }}>
                No credentials in your wallet. Receive a credential first.
              </Text>
            </View>
          ) : (
            credentials.map((cred) => {
              const isSelected = selectedIds.includes(cred.id);
              const accent = getAccentColor(cred.type);

              return (
                <Pressable
                  key={cred.id}
                  onPress={() => toggleCredential(cred.id)}
                  style={({ pressed }) => ({
                    backgroundColor: colors.surface,
                    borderRadius: 18,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? accent : colors.border,
                    padding: isSelected ? 17 : 18,
                    marginBottom: 12,
                    opacity: pressed ? 0.8 : 1,
                  })}
                  accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${cred.typeName} from ${cred.issuerName}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{ color: colors.foreground, fontWeight: '500', fontSize: 15 }}
                      >
                        {cred.typeName}
                      </Text>
                      <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 2 }}>
                        {cred.issuerName}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? accent : colors.muted,
                        backgroundColor: isSelected ? accent : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={14} color={colors.primaryFg} />
                      )}
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}

          <Pressable
            onPress={() => {
              if (selectedIds.length > 0) setStep('disclose');
            }}
            disabled={selectedIds.length === 0}
            style={({ pressed }) => ({
              marginTop: 16,
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: 'center',
              minHeight: 48,
              backgroundColor:
                selectedIds.length > 0
                  ? colors.primary
                  : colors.muted,
              opacity: selectedIds.length > 0 && pressed ? 0.85 : 1,
            })}
            accessibilityLabel="Proceed to disclosure selection"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontWeight: selectedIds.length > 0 ? '700' : '500',
                fontSize: 15,
                color: selectedIds.length > 0 ? colors.primaryFg : colors.mutedText,
              }}
            >
              Next
            </Text>
          </Pressable>
        </View>
      )}

      {step === 'disclose' && (
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Choose Disclosures
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 14, marginBottom: 16 }}>
            Toggle which claims to reveal. Required claims cannot be turned off.
          </Text>

          {allDisclosableClaims.map((claim) => {
            const isRequired = claim.required;
            const isOn = disclosures[claim.key] ?? true;

            return (
              <View
                key={`${claim.credentialId}-${claim.key}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: colors.surface,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 18,
                  paddingVertical: 14,
                  marginBottom: 10,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: 14,
                    }}
                  >
                    {getClaimLabel(claim.key)}
                  </Text>
                  <Text style={{ color: colors.mutedText, fontSize: 11, marginTop: 2 }}>
                    {claim.credentialType}
                    {isRequired ? ' (required)' : ''}
                  </Text>
                </View>
                <Switch
                  value={isOn}
                  onValueChange={() => toggleDisclosure(claim.key)}
                  disabled={isRequired}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFFFFF"
                  accessibilityLabel={`${isOn ? 'Hide' : 'Reveal'} ${getClaimLabel(claim.key)}`}
                />
              </View>
            );
          })}

          <Pressable
            onPress={handleShowConsent}
            style={({ pressed }) => ({
              marginTop: 16,
              paddingVertical: 14,
              borderRadius: 16,
              alignItems: 'center',
              minHeight: 48,
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
            })}
            accessibilityLabel="Review and provide consent"
            accessibilityRole="button"
          >
            <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 15 }}>
              Review & Consent
            </Text>
          </Pressable>
        </View>
      )}

      {step === 'consent' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <Text style={{ color: colors.mutedText, fontSize: 14 }}>
            Waiting for consent...
          </Text>
        </View>
      )}

      {step === 'submitting' && (
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
            Submitting presentation...
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 14, marginTop: 8 }}>
            Communicating with verifier
          </Text>
        </View>
      )}

      {step === 'result' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <AnimatedCheck
            type={result === 'verified' ? 'success' : 'error'}
            size={80}
          />
          <Text
            style={{
              color: colors.foreground,
              fontSize: 22,
              fontWeight: '700',
              marginTop: 20,
              marginBottom: 8,
            }}
          >
            {result === 'verified' ? 'Verified' : 'Rejected'}
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
            {result === 'verified'
              ? 'Your credentials have been successfully verified.'
              : 'The verification was rejected. Please check your credentials.'}
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
              Back to Wallet
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
            Presentation Failed
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
          <Pressable
            onPress={() => router.replace(TABS.HOME)}
            style={({ pressed }) => ({
              backgroundColor: colors.muted,
              opacity: pressed ? 0.85 : 1,
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
              minHeight: 44,
            })}
            accessibilityLabel="Return to wallet"
            accessibilityRole="button"
          >
            <Text style={{ color: colors.foreground, fontWeight: '500', fontSize: 15 }}>
              Back to Wallet
            </Text>
          </Pressable>
        </View>
      )}

      {/* Consent Bottom Sheet */}
      <ConsentSheet
        visible={showConsentSheet}
        verifierName={verificationRequest?.verifierName ?? 'Verifier'}
        purpose={verificationRequest?.purpose ?? 'Identity verification'}
        disclosures={consentDisclosures}
        onAllow={handleConsentAllow}
        onDeny={handleConsentDeny}
      />
    </ScrollView>
  );
}
