import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { TABS } from '@/lib/routes';

export function EmptyState() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const shadow = isDark ? cardShadowDark : cardShadow;

  return (
    <View
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
    >
      <View
        style={{
          width: 112,
          height: 112,
          backgroundColor: `${colors.primary}14`,
          borderRadius: 56,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 28,
        }}
      >
        <Ionicons name="shield-checkmark" size={44} color={colors.primary} />
      </View>
      <Text
        style={{
          color: colors.foreground,
          fontSize: 22,
          fontWeight: '700',
          textAlign: 'center',
          marginBottom: 10,
        }}
      >
        No Credentials Yet
      </Text>
      <Text
        style={{ color: colors.mutedText, fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 28 }}
      >
        Scan a QR code from an issuer to receive your first verifiable credential.
      </Text>
      <Pressable
        onPress={() => router.push(TABS.SCANNER)}
        style={({ pressed }) => ({
          backgroundColor: colors.primary,
          opacity: pressed ? 0.9 : 1,
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 16,
          minHeight: 48,
          minWidth: 48,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          ...shadow,
        })}
        accessibilityLabel="Scan QR code to receive your first credential"
        accessibilityRole="button"
        accessibilityHint="Opens the QR scanner camera"
      >
        <Ionicons name="qr-code-outline" size={18} color={colors.primaryFg} />
        <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 15 }}>Scan QR Code</Text>
      </Pressable>
    </View>
  );
}
