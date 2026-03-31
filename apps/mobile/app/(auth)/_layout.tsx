import { Stack } from 'expo-router';
import { useTheme } from '@/lib/theme';

export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="lock" options={{ gestureEnabled: false }} />
      <Stack.Screen name="setup-mpin" />
    </Stack>
  );
}
