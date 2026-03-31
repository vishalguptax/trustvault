import { Stack } from 'expo-router';

export default function TabsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#F9FAFB',
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: '#0B1120' },
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
