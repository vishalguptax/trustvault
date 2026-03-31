import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '@/lib/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'TrustVault Wallet',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              style={({ pressed }) => ({
                width: 32, height: 32, borderRadius: 16,
                backgroundColor: `${colors.primary}20`,
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                marginRight: 4,
              })}
              accessibilityLabel="Open profile"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
                P
              </Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="credential/[id]" options={{ title: 'Credential Details' }} />
      <Stack.Screen name="receive" options={{ title: 'Receive Credential', presentation: 'modal' }} />
      <Stack.Screen name="present" options={{ title: 'Present Credential', presentation: 'modal' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scan QR Code', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="history" options={{ title: 'Consent History' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile & Settings' }} />
    </Stack>
  );
}
