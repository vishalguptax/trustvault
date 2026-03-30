import { View, Text, Pressable, ScrollView, Switch } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StepIndicator } from '@/components/step-indicator';
import { useCredentialStore } from '@/lib/store';

type PresentStep = 'select' | 'disclose' | 'consent' | 'submitting' | 'result';

export default function PresentScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const credentials = useCredentialStore((state) => state.credentials);
  const [step, setStep] = useState<PresentStep>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [disclosures, setDisclosures] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<'verified' | 'rejected' | null>(null);

  const toggleCredential = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleDisclosure = (claim: string) => {
    setDisclosures((prev) => ({ ...prev, [claim]: !prev[claim] }));
  };

  const handleConsent = async () => {
    setStep('submitting');
    // TODO: Call POST /wallet/presentations/create
    setTimeout(() => {
      setResult('verified');
      setStep('result');
    }, 2000);
  };

  const stepIndex =
    step === 'select' ? 0
    : step === 'disclose' ? 1
    : step === 'consent' ? 2
    : step === 'submitting' ? 3
    : 4;

  return (
    <ScrollView className="flex-1 bg-vault-bg" contentContainerStyle={{ padding: 16 }}>
      <StepIndicator
        steps={['Select', 'Disclose', 'Consent', 'Submit', 'Result']}
        currentStep={stepIndex}
      />

      {step === 'select' && (
        <View className="mt-6">
          <Text className="text-vault-foreground text-lg font-semibold mb-2">
            Select Credentials
          </Text>
          <Text className="text-vault-muted-text text-sm mb-4">
            Choose which credentials to present to the verifier.
          </Text>
          {credentials.map((cred) => (
            <Pressable
              key={cred.id}
              onPress={() => toggleCredential(cred.id)}
              className={`bg-vault-surface rounded-xl p-4 mb-3 border-2 ${
                selectedIds.includes(cred.id) ? 'border-primary' : 'border-transparent'
              } active:opacity-80`}
            >
              <Text className="text-vault-foreground font-medium">{cred.typeName}</Text>
              <Text className="text-vault-muted-text text-xs">{cred.issuerName}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setStep('disclose')}
            disabled={selectedIds.length === 0}
            className={`mt-4 py-3 rounded-lg items-center ${
              selectedIds.length > 0 ? 'bg-primary active:opacity-80' : 'bg-vault-muted'
            }`}
          >
            <Text className={selectedIds.length > 0 ? 'text-vault-bg font-bold' : 'text-vault-muted-text'}>
              Next
            </Text>
          </Pressable>
        </View>
      )}

      {step === 'disclose' && (
        <View className="mt-6">
          <Text className="text-vault-foreground text-lg font-semibold mb-2">
            Choose Disclosures
          </Text>
          <Text className="text-vault-muted-text text-sm mb-4">
            Toggle which claims to reveal. Required claims cannot be turned off.
          </Text>
          {/* Placeholder claims for selected credentials */}
          {['name', 'institution', 'amount', 'date'].map((claim) => (
            <View
              key={claim}
              className="flex-row items-center justify-between bg-vault-surface rounded-lg px-4 py-3 mb-2"
            >
              <Text className="text-vault-foreground capitalize">{claim}</Text>
              <Switch
                value={disclosures[claim] ?? true}
                onValueChange={() => toggleDisclosure(claim)}
                trackColor={{ false: '#1F2937', true: '#14B8A6' }}
                thumbColor="#F9FAFB"
              />
            </View>
          ))}
          <Pressable
            onPress={() => setStep('consent')}
            className="mt-4 bg-primary py-3 rounded-lg items-center active:opacity-80"
          >
            <Text className="text-vault-bg font-bold">Review & Consent</Text>
          </Pressable>
        </View>
      )}

      {step === 'consent' && (
        <View className="mt-6">
          <View className="bg-vault-surface rounded-xl p-4 mb-4 border border-warning/30">
            <Text className="text-warning text-sm font-semibold mb-2">
              Consent Required
            </Text>
            <Text className="text-vault-foreground text-base font-semibold mb-1">
              Verifier is requesting your credentials
            </Text>
            <Text className="text-vault-muted-text text-sm mb-4">
              The following information will be shared:
            </Text>
            {Object.entries(disclosures)
              .filter(([, disclosed]) => disclosed)
              .map(([claim]) => (
                <Text key={claim} className="text-vault-foreground text-sm ml-2 mb-1">
                  • {claim}
                </Text>
              ))}
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 bg-vault-muted py-3 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-vault-foreground font-medium">Deny</Text>
            </Pressable>
            <Pressable
              onPress={handleConsent}
              className="flex-1 bg-primary py-3 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-vault-bg font-bold">Allow</Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 'submitting' && (
        <View className="mt-6 items-center">
          <Text className="text-vault-foreground text-lg font-semibold">
            Submitting presentation...
          </Text>
        </View>
      )}

      {step === 'result' && (
        <View className="mt-6 items-center">
          <View
            className={`w-20 h-20 rounded-full items-center justify-center mb-4 ${
              result === 'verified' ? 'bg-success/20' : 'bg-danger/20'
            }`}
          >
            <Text className={`text-4xl ${result === 'verified' ? 'text-success' : 'text-danger'}`}>
              {result === 'verified' ? '✓' : '✕'}
            </Text>
          </View>
          <Text className="text-vault-foreground text-xl font-bold mb-2">
            {result === 'verified' ? 'Verified' : 'Rejected'}
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            className="mt-4 bg-primary px-8 py-3 rounded-lg active:opacity-80"
          >
            <Text className="text-vault-bg font-bold">Back to Wallet</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
