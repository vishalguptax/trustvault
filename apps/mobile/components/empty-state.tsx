import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/lib/theme';

export function EmptyState() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View style={{
        width: 96,
        height: 96,
        backgroundColor: colors.surface,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
      }}>
        <Text style={{ fontSize: 40 }}>🔐</Text>
      </View>
      <Text style={{ color: colors.foreground, fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
        No Credentials Yet
      </Text>
      <Text style={{ color: colors.mutedText, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
        Scan a QR code from an issuer to receive your first verifiable credential.
      </Text>
      <Pressable
        onPress={() => router.push('/scanner')}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          opacity: pressed ? 0.85 : 1,
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
        <Text style={{ color: colors.primaryFg, fontWeight: '700' }}>Scan QR Code</Text>
      </Pressable>
    </View>
  );
}
