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
import { CREDENTIAL_TYPE_CONFIG, getClaimLabel, formatCredentialType, getDocumentTitle } from '@/lib/constants';
import { filterUserClaims, didDisplayName } from '@/lib/format';
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
      : step === 'disclose' || step === 'consent'
        ? 1
        : 2;

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
    const claims: { key: string; credentialId: string; credentialType: string; required: boolean; isSD: boolean }[] = [];
    selectedCredentials.forEach((cred) => {
      const userClaims = filterUserClaims(cred.claims);
      const userClaimKeys = Object.keys(userClaims);
      const seen = new Set<string>();

      // SD claims (selectively disclosable — user can toggle)
      cred.sdClaims.forEach((claim) => {
        if (seen.has(claim)) return;
        // Only include if it is a user-facing claim
        if (!userClaimKeys.includes(claim) && !userClaims[claim]) return;
        seen.add(claim);
        claims.push({
          key: claim,
          credentialId: cred.id,
          credentialType: cred.typeName,
          required: requiredClaimKeys.has(claim),
          isSD: true,
        });
      });

      // Non-SD claims (always disclosed, cannot toggle)
      userClaimKeys.forEach((claim) => {
        if (seen.has(claim)) return;
        seen.add(claim);
        claims.push({
          key: claim,
          credentialId: cred.id,
          credentialType: cred.typeName,
          required: true,
          isSD: false,
        });
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
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    >
      <StepIndicator
        steps={['Select', 'Review', 'Done']}
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
        <View style={{ marginTop: 20 }}>
          {/* Verifier info card */}
          {verificationRequest && (
            <View style={{
              backgroundColor: colors.surface, borderRadius: 16,
              borderWidth: 1, borderColor: colors.border,
              padding: 16, marginBottom: 20,
              ...shadow,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${colors.info}14`,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '700' }}>
                    {verificationRequest.verifierName}
                  </Text>
                  <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 2 }}>
                    {verificationRequest.purpose}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Section title */}
          <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700', marginBottom: 4 }}>
            Select Credentials
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>
            {verificationRequest?.requiredCredentialTypes.length
              ? `Required: ${verificationRequest.requiredCredentialTypes.map(t => formatCredentialType(t) || t).join(', ')}`
              : 'Choose which credentials to present.'}
          </Text>

          {credentials.length === 0 ? (
            <View style={{
              backgroundColor: colors.surface, borderRadius: 16,
              borderWidth: 1, borderColor: colors.border,
              padding: 32, alignItems: 'center',
            }}>
              <Ionicons name="wallet-outline" size={36} color={colors.mutedText} />
              <Text style={{ color: colors.mutedText, fontSize: 14, textAlign: 'center', marginTop: 12 }}>
                No credentials in your wallet.{'\n'}Receive a credential first.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {credentials.map((cred) => {
                const isSelected = selectedIds.includes(cred.id);
                const accent = getAccentColor(cred.type);

                return (
                  <Pressable
                    key={cred.id}
                    onPress={() => toggleCredential(cred.id)}
                    style={({ pressed }) => ({
                      backgroundColor: colors.surface,
                      borderRadius: 16,
                      borderWidth: isSelected ? 2 : 1,
                      borderColor: isSelected ? accent : colors.border,
                      padding: isSelected ? 15 : 16,
                      opacity: pressed ? 0.9 : 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 14,
                      ...shadow,
                    })}
                    accessibilityLabel={`${isSelected ? 'Deselect' : 'Select'} ${cred.typeName}`}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    {/* Checkbox */}
                    <View style={{
                      width: 24, height: 24, borderRadius: 12,
                      borderWidth: 2,
                      borderColor: isSelected ? accent : colors.border,
                      backgroundColor: isSelected ? accent : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isSelected && <Ionicons name="checkmark" size={14} color={colors.primaryFg} />}
                    </View>

                    {/* Credential info */}
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }} numberOfLines={2}>
                        {getDocumentTitle(cred.type, cred.claims)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: accent }} />
                        <Text style={{ color: accent, fontSize: 11, fontWeight: '600' }}>
                          {formatCredentialType(cred.type) || cred.typeName}
                        </Text>
                        <Text style={{ color: colors.border, fontSize: 11 }}>·</Text>
                        <Text style={{ color: colors.mutedText, fontSize: 11, flex: 1 }} numberOfLines={1}>
                          {cred.issuerName && !cred.issuerName.startsWith('did:')
                            ? cred.issuerName
                            : didDisplayName(cred.issuerDid)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* Next button */}
          <Pressable
            onPress={() => { if (selectedIds.length > 0) { impactMedium(); setStep('disclose'); } }}
            disabled={selectedIds.length === 0}
            style={({ pressed }) => ({
              marginTop: 20,
              paddingVertical: 15,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              minHeight: 50,
              backgroundColor: selectedIds.length > 0 ? colors.primary : colors.muted,
              opacity: selectedIds.length > 0 && pressed ? 0.85 : 1,
            })}
            accessibilityLabel="Proceed to disclosure selection"
            accessibilityRole="button"
          >
            <Text style={{
              fontWeight: selectedIds.length > 0 ? '700' : '500', fontSize: 15,
              color: selectedIds.length > 0 ? colors.primaryFg : colors.mutedText,
            }}>
              Review Disclosures
            </Text>
            {selectedIds.length > 0 && <Ionicons name="arrow-forward" size={16} color={colors.primaryFg} />}
          </Pressable>
        </View>
      )}

      {step === 'disclose' && (
        <View style={{ marginTop: 20 }}>
          {/* Header */}
          <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700', marginBottom: 4 }}>
            Review Disclosures
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>
            Control which claims are shared. Required claims cannot be hidden.
          </Text>

          {/* Legend */}
          <View style={{
            flexDirection: 'row', gap: 16, marginBottom: 14,
            paddingHorizontal: 4,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="eye-outline" size={13} color={colors.primary} />
              <Text style={{ color: colors.mutedText, fontSize: 11 }}>Optional</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Ionicons name="lock-closed-outline" size={13} color={colors.mutedText} />
              <Text style={{ color: colors.mutedText, fontSize: 11 }}>Always shared</Text>
            </View>
          </View>

          {allDisclosableClaims.map((claim) => {
            const isOn = disclosures[claim.key] ?? true;
            const canToggle = claim.isSD && !claim.required;

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
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
                  <Ionicons
                    name={claim.isSD ? 'eye-outline' : 'lock-closed-outline'}
                    size={16}
                    color={claim.isSD ? colors.primary : colors.mutedText}
                    style={{ marginRight: 12 }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>
                      {getClaimLabel(claim.key)}
                    </Text>
                    <Text style={{ color: colors.mutedText, fontSize: 11, marginTop: 2 }}>
                      {claim.isSD
                        ? (claim.required ? 'Required by verifier' : 'Optional — you choose')
                        : 'Always shared'}
                    </Text>
                  </View>
                </View>
                {canToggle ? (
                  <Switch
                    value={isOn}
                    onValueChange={() => toggleDisclosure(claim.key)}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#FFFFFF"
                    accessibilityLabel={`${isOn ? 'Hide' : 'Reveal'} ${getClaimLabel(claim.key)}`}
                  />
                ) : (
                  <View style={{
                    backgroundColor: claim.required ? `${colors.primary}14` : colors.muted,
                    borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 4,
                  }}>
                    <Text style={{
                      color: claim.required ? colors.primary : colors.mutedText,
                      fontSize: 11, fontWeight: '600',
                    }}>
                      {claim.required ? 'Required' : 'Shared'}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Action buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Pressable
              onPress={() => setStep('select')}
              style={({ pressed }) => ({
                flex: 1,
                backgroundColor: colors.muted,
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 50,
                opacity: pressed ? 0.85 : 1,
              })}
              accessibilityLabel="Go back to credential selection"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }}>Back</Text>
            </Pressable>
            <Pressable
              onPress={() => { impactMedium(); handleShowConsent(); }}
              style={({ pressed }) => ({
                flex: 1.4,
                backgroundColor: colors.primary,
                paddingVertical: 15,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                minHeight: 50,
                opacity: pressed ? 0.85 : 1,
              })}
              accessibilityLabel="Submit presentation"
              accessibilityRole="button"
            >
              <Ionicons name="send" size={16} color={colors.primaryFg} />
              <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 15 }}>
                Present
              </Text>
            </Pressable>
          </View>
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
          <Text style={{
            color: colors.foreground, fontSize: 22, fontWeight: '700',
            marginTop: 20, marginBottom: 8,
          }}>
            {result === 'verified' ? 'Verified Successfully' : 'Verification Rejected'}
          </Text>
          <Text style={{
            color: colors.mutedText, fontSize: 14, textAlign: 'center',
            marginBottom: 12, paddingHorizontal: 16, lineHeight: 20,
          }}>
            {result === 'verified'
              ? 'Your credentials were successfully verified by the verifier.'
              : 'The verifier could not verify your credentials. This may be due to trust policy or expired credentials.'}
          </Text>

          {/* Summary card */}
          <View style={{
            backgroundColor: colors.surface, borderRadius: 14,
            borderWidth: 1, borderColor: colors.border,
            padding: 14, width: '100%', marginBottom: 28,
            ...shadow,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.mutedText, fontSize: 12 }}>Verifier</Text>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
                {verificationRequest?.verifierName ?? 'Verifier'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.mutedText, fontSize: 12 }}>Credentials</Text>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
                {selectedIds.length}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: colors.mutedText, fontSize: 12 }}>Claims shared</Text>
              <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
                {disclosedClaimsList.length}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => router.replace(TABS.HOME)}
            style={({ pressed }) => ({
              backgroundColor: colors.primary,
              opacity: pressed ? 0.85 : 1,
              paddingHorizontal: 32, paddingVertical: 14,
              borderRadius: 14, minHeight: 48,
              flexDirection: 'row', alignItems: 'center', gap: 8,
            })}
            accessibilityLabel="Return to wallet"
            accessibilityRole="button"
          >
            <Ionicons name="wallet-outline" size={18} color={colors.primaryFg} />
            <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 15 }}>
              Back to Wallet
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
            Presentation Failed
          </Text>
          <Text style={{
            color: colors.mutedText, fontSize: 14, textAlign: 'center',
            marginBottom: 32, paddingHorizontal: 16, lineHeight: 20,
          }}>
            {errorMessage}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Pressable
              onPress={() => router.replace(TABS.HOME)}
              style={({ pressed }) => ({
                backgroundColor: colors.muted,
                opacity: pressed ? 0.85 : 1,
                paddingHorizontal: 24, paddingVertical: 14,
                borderRadius: 12, minHeight: 44,
              })}
              accessibilityLabel="Return to wallet"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.foreground, fontWeight: '500' }}>Back to Wallet</Text>
            </Pressable>
            <Pressable
              onPress={() => { setStep('select'); setErrorMessage(''); }}
              style={({ pressed }) => ({
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                paddingHorizontal: 24, paddingVertical: 14,
                borderRadius: 12, minHeight: 44,
              })}
              accessibilityLabel="Try again"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.primaryFg, fontWeight: '700' }}>Try Again</Text>
            </Pressable>
          </View>
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
