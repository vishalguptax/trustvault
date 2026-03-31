import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export function EmptyState() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View style={{
        width: 96,
        height: 96,
        backgroundColor: '#111827',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <Text style={{ fontSize: 40 }}>🔐</Text>
      </View>
      <Text style={{ color: '#F9FAFB', fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
        No Credentials Yet
      </Text>
      <Text style={{ color: '#6B7280', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
        Scan a QR code from an issuer to receive your first verifiable credential.
      </Text>
      <Pressable
        onPress={() => router.push('/scanner')}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#0D9488' : '#14B8A6',
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 8,
          minHeight: 44,
          minWidth: 44,
          alignItems: 'center',
          justifyContent: 'center',
        })}
        accessibilityLabel="Scan QR code to receive your first credential"
        accessibilityRole="button"
        accessibilityHint="Opens the QR scanner camera"
      >
        <Text style={{ color: '#0B1120', fontWeight: '700' }}>Scan QR Code</Text>
      </Pressable>
    </View>
  );
}
