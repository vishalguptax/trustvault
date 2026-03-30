import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StepIndicator } from '@/components/step-indicator';

type ReceiveStep = 'preview' | 'confirming' | 'success';

export default function ReceiveScreen() {
  const router = useRouter();
  const { uri } = useLocalSearchParams<{ uri: string }>();
  const [step, setStep] = useState<ReceiveStep>('preview');

  const handleAccept = async () => {
    setStep('confirming');
    // TODO: Call POST /wallet/credentials/receive with the offer URI
    // Simulating for now
    setTimeout(() => setStep('success'), 1500);
  };

  return (
    <ScrollView className="flex-1 bg-vault-bg" contentContainerStyle={{ padding: 16 }}>
      <StepIndicator
        steps={['Preview', 'Confirm', 'Done']}
        currentStep={step === 'preview' ? 0 : step === 'confirming' ? 1 : 2}
      />

      {step === 'preview' && (
        <View className="mt-6">
          <View className="bg-vault-surface rounded-xl p-4 mb-4">
            <Text className="text-vault-foreground text-lg font-semibold mb-2">
              Credential Offer
            </Text>
            <Text className="text-vault-muted-text text-sm mb-4">
              An issuer wants to send you a credential.
            </Text>

            <View className="bg-vault-muted rounded-lg p-3 mb-3">
              <Text className="text-vault-muted-text text-xs mb-1">Issuer</Text>
              <Text className="text-vault-foreground text-sm">Loading...</Text>
            </View>

            <View className="bg-vault-muted rounded-lg p-3 mb-3">
              <Text className="text-vault-muted-text text-xs mb-1">Credential Type</Text>
              <Text className="text-vault-foreground text-sm">Loading...</Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.back()}
              className="flex-1 bg-vault-muted py-3 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-vault-foreground font-medium">Decline</Text>
            </Pressable>
            <Pressable
              onPress={handleAccept}
              className="flex-1 bg-primary py-3 rounded-lg items-center active:opacity-80"
            >
              <Text className="text-vault-bg font-bold">Accept</Text>
            </Pressable>
          </View>
        </View>
      )}

      {step === 'confirming' && (
        <View className="mt-6 items-center">
          <Text className="text-vault-foreground text-lg font-semibold">
            Receiving credential...
          </Text>
          <Text className="text-vault-muted-text text-sm mt-2">
            Communicating with issuer
          </Text>
        </View>
      )}

      {step === 'success' && (
        <View className="mt-6 items-center">
          <View className="w-20 h-20 bg-success/20 rounded-full items-center justify-center mb-4">
            <Text className="text-success text-4xl">✓</Text>
          </View>
          <Text className="text-vault-foreground text-xl font-bold mb-2">
            Credential Received
          </Text>
          <Text className="text-vault-muted-text text-sm text-center mb-6">
            The credential has been securely stored in your wallet.
          </Text>
          <Pressable
            onPress={() => router.replace('/')}
            className="bg-primary px-8 py-3 rounded-lg active:opacity-80"
          >
            <Text className="text-vault-bg font-bold">View in Wallet</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
