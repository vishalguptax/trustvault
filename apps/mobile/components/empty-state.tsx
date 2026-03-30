import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export function EmptyState() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-24 h-24 bg-vault-surface rounded-3xl items-center justify-center mb-6">
        <Text className="text-4xl">🔐</Text>
      </View>
      <Text className="text-vault-foreground text-xl font-bold text-center mb-2">
        No Credentials Yet
      </Text>
      <Text className="text-vault-muted-text text-sm text-center mb-6">
        Scan a QR code from an issuer to receive your first verifiable credential.
      </Text>
      <Pressable
        onPress={() => router.push('/scanner')}
        className="bg-primary px-6 py-3 rounded-lg active:opacity-80"
        style={{ minHeight: 44, minWidth: 44 }}
        accessibilityLabel="Scan QR code to receive your first credential"
        accessibilityRole="button"
        accessibilityHint="Opens the QR scanner camera"
      >
        <Text className="text-vault-bg font-bold">Scan QR Code</Text>
      </Pressable>
    </View>
  );
}
