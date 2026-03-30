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
import * as Haptics from 'expo-haptics';
import { StepIndicator } from '@/components/step-indicator';
import { AnimatedCheck } from '@/components/animated-check';
import { ConsentSheet } from '@/components/consent-sheet';
import { useCredentialStore, StoredCredential } from '@/lib/store';
import { api } from '@/lib/api';
import { CREDENTIAL_TYPE_CONFIG } from '@/lib/constants';

type PresentStep = 'loading' | 'select' | 'disclose' | 'consent' | 'submitting' | 'result' | 'error';

const HOLDER_ID = 'demo-holder';

interface VerificationRequest {
  id: string;
  verifierDid: string;
  verifierName: string;
  purpose: string;
  requiredCredentialTypes: string[];
  requiredClaims: Record<string, string[]>;
}

interface PresentationResult {
  verificationId: string;
  result: 'verified' | 'rejected';
  checks: Record<string, boolean>;
}

function parseVerificationUri(uri: string): VerificationRequest | null {
  try {
    const url = new URL(uri);
    const requestUri = url.searchParams.get('request_uri') ?? '';
    // Extract request ID from the request_uri path
    const requestIdMatch = requestUri.match(/presentations\/([^/?]+)/);
    const requestId = requestIdMatch ? requestIdMatch[1] : url.searchParams.get('state') ?? '';

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
    const claims: { key: string; credentialType: string; required: boolean }[] = [];
    selectedCredentials.forEach((cred) => {
      cred.sdClaims.forEach((claim) => {
        claims.push({
          key: claim,
          credentialType: cred.typeName,
          required: requiredClaimKeys.has(claim),
        });
      });
      // Also include non-SD claims (always disclosed)
      Object.keys(cred.claims).forEach((claim) => {
        if (!cred.sdClaims.includes(claim)) {
          claims.push({
            key: claim,
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

      const response = await api.post<PresentationResult>(
        '/wallet/presentations/create',
        {
          verificationRequestId: verificationRequest?.id ?? '',
          holderId: HOLDER_ID,
          selectedCredentials: selectedIds,
          disclosedClaims: disclosedClaimsMap,
          consent: true,
        },
      );

      setResult(response.result);
      Haptics.notificationAsync(
        response.result === 'verified'
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );

      addConsentRecord({
        id: response.verificationId,
        verifierName: verificationRequest?.verifierName ?? 'Verifier',
        verifierDid: verificationRequest?.verifierDid ?? '',
        credentialIds: selectedIds,
        disclosedClaims: disclosedClaimsList,
        result: response.result,
        timestamp: new Date().toISOString(),
      });

      setStep('result');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create presentation';
      setErrorMessage(message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    return config?.accent ?? '#14B8A6';
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#0B1120' }}
      contentContainerStyle={{ padding: 16 }}
    >
      <StepIndicator
        steps={['Select', 'Disclose', 'Consent', 'Submit', 'Result']}
        currentStep={stepIndex}
      />

      {step === 'loading' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 12 }}>
            Loading verification request...
          </Text>
        </View>
      )}

      {step === 'select' && (
        <View style={{ marginTop: 24 }}>
          <Text
            style={{
              color: '#F9FAFB',
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Select Credentials
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
            {verificationRequest?.requiredCredentialTypes.length
              ? `The verifier requests: ${verificationRequest.requiredCredentialTypes.join(', ')}`
              : 'Choose which credentials to present to the verifier.'}
          </Text>

          {credentials.length === 0 ? (
            <View
              style={{
                backgroundColor: '#111827',
                borderRadius: 12,
                padding: 24,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center' }}>
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
                    backgroundColor: '#111827',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? accent : 'transparent',
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
                        style={{ color: '#F9FAFB', fontWeight: '500', fontSize: 15 }}
                      >
                        {cred.typeName}
                      </Text>
                      <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                        {cred.issuerName}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: isSelected ? accent : '#1F2937',
                        backgroundColor: isSelected ? accent : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {isSelected && (
                        <Text style={{ color: '#0B1120', fontSize: 12, fontWeight: '700' }}>
                          ✓
                        </Text>
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
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor:
                selectedIds.length > 0
                  ? pressed
                    ? '#0D9488'
                    : '#14B8A6'
                  : '#1F2937',
            })}
            accessibilityLabel="Proceed to disclosure selection"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontWeight: selectedIds.length > 0 ? '700' : '500',
                fontSize: 15,
                color: selectedIds.length > 0 ? '#0B1120' : '#6B7280',
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
              color: '#F9FAFB',
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 8,
            }}
          >
            Choose Disclosures
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 14, marginBottom: 16 }}>
            Toggle which claims to reveal. Required claims cannot be turned off.
          </Text>

          {allDisclosableClaims.map((claim) => {
            const isRequired = claim.required;
            const isOn = disclosures[claim.key] ?? true;

            return (
              <View
                key={`${claim.credentialType}-${claim.key}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#111827',
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  marginBottom: 8,
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: '#F9FAFB',
                      fontSize: 14,
                      textTransform: 'capitalize',
                    }}
                  >
                    {claim.key}
                  </Text>
                  <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>
                    {claim.credentialType}
                    {isRequired ? ' (required)' : ''}
                  </Text>
                </View>
                <Switch
                  value={isOn}
                  onValueChange={() => toggleDisclosure(claim.key)}
                  disabled={isRequired}
                  trackColor={{ false: '#1F2937', true: '#14B8A6' }}
                  thumbColor="#F9FAFB"
                  accessibilityLabel={`${isOn ? 'Hide' : 'Reveal'} ${claim.key}`}
                />
              </View>
            );
          })}

          <Pressable
            onPress={handleShowConsent}
            style={({ pressed }) => ({
              marginTop: 16,
              paddingVertical: 14,
              borderRadius: 12,
              alignItems: 'center',
              backgroundColor: pressed ? '#0D9488' : '#14B8A6',
            })}
            accessibilityLabel="Review and provide consent"
            accessibilityRole="button"
          >
            <Text style={{ color: '#0B1120', fontWeight: '700', fontSize: 15 }}>
              Review & Consent
            </Text>
          </Pressable>
        </View>
      )}

      {step === 'consent' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <Text style={{ color: '#6B7280', fontSize: 14 }}>
            Waiting for consent...
          </Text>
        </View>
      )}

      {step === 'submitting' && (
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
            Submitting presentation...
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>
            Communicating with verifier
          </Text>
        </View>
      )}

      {step === 'result' && (
        <View style={{ marginTop: 48, alignItems: 'center' }}>
          <AnimatedCheck
            variant={result === 'verified' ? 'success' : 'rejection'}
            size={80}
          />
          <Text
            style={{
              color: '#F9FAFB',
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
              color: '#6B7280',
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
              Back to Wallet
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
            Presentation Failed
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
          <Pressable
            onPress={() => router.replace('/')}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#374151' : '#1F2937',
              paddingHorizontal: 32,
              paddingVertical: 14,
              borderRadius: 12,
            })}
            accessibilityLabel="Return to wallet"
            accessibilityRole="button"
          >
            <Text style={{ color: '#F9FAFB', fontWeight: '500', fontSize: 15 }}>
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
