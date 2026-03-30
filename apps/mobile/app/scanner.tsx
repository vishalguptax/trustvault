import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';

export default function ScannerScreen() {
  const router = useRouter();
  const [scanned, setScanned] = useState(false);

  const handleBarCodeScanned = (data: string) => {
    if (scanned) return;
    setScanned(true);

    if (data.startsWith('openid-credential-offer://')) {
      router.replace({ pathname: '/receive', params: { uri: data } });
    } else if (data.startsWith('openid-vc://')) {
      router.replace({ pathname: '/present', params: { uri: data } });
    } else {
      setScanned(false);
    }
  };

  return (
    <View className="flex-1 bg-vault-bg items-center justify-center">
      <View className="w-64 h-64 border-2 border-primary rounded-2xl items-center justify-center mb-6">
        <Text className="text-vault-muted-text text-center px-4">
          Camera QR scanner will activate when running on a device via Expo Go.
        </Text>
      </View>

      <Text className="text-vault-foreground text-lg font-semibold mb-2">
        Scan QR Code
      </Text>
      <Text className="text-vault-muted-text text-sm text-center px-8 mb-6">
        Point your camera at a credential offer or verification request QR code.
      </Text>

      {/* Dev mode: manual URI entry */}
      <Pressable
        onPress={() => handleBarCodeScanned('openid-credential-offer://example')}
        className="bg-vault-muted px-6 py-3 rounded-lg active:opacity-80"
      >
        <Text className="text-vault-foreground text-sm">Simulate Scan (Dev)</Text>
      </Pressable>

      <Pressable
        onPress={() => router.back()}
        className="mt-4 px-6 py-3"
      >
        <Text className="text-vault-muted-text text-sm">Cancel</Text>
      </Pressable>
    </View>
  );
}
