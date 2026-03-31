import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme';

export default function TabsLayout() {
  const { colors } = useTheme();

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
      <Stack.Screen name="index" options={{ title: 'TrustVault Wallet' }} />
      <Stack.Screen name="credential/[id]" options={{ title: 'Credential Details' }} />
      <Stack.Screen name="receive" options={{ title: 'Receive Credential', presentation: 'modal' }} />
      <Stack.Screen name="present" options={{ title: 'Present Credential', presentation: 'modal' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scan QR Code', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="history" options={{ title: 'Consent History' }} />
    </Stack>
  );
}
