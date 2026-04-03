import { Stack, useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrustiLockLogo } from '@/components/trustilock-logo';
import { MeshGradient } from '@/components/mesh-gradient';
import { useTheme } from '@/lib/theme';
import { useAuth } from '@/lib/auth/auth-context';
import { TABS } from '@/lib/routes';

export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <View style={{ flex: 1 }}>
      <MeshGradient />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: 'transparent', elevation: 0, shadowOpacity: 0 },
          headerShadowVisible: false,
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontWeight: '600', fontSize: 17 },
          headerBackTitleVisible: false,
          headerTitleAlign: 'left',
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'slide_from_right',
        }}
      >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{
                width: 30, height: 30, borderRadius: 10,
                backgroundColor: `${colors.primary}18`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <TrustiLockLogo size={20} color={colors.primary} />
              </View>
              <Text style={{ color: colors.foreground, fontSize: 17, fontWeight: '700' }}>
                TrustiLock
              </Text>
            </View>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => router.push(TABS.PROFILE)}
              style={({ pressed }) => ({
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: `${colors.primary}18`,
                alignItems: 'center', justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
                marginRight: 4,
              })}
              accessibilityLabel="Open profile"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>
                {initial}
              </Text>
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="credentials" options={{ title: 'My Credentials' }} />
      <Stack.Screen name="credential/[id]" options={{ title: 'Credential Details' }} />
      <Stack.Screen name="receive" options={{ title: 'Receive Credential', presentation: 'modal' }} />
      <Stack.Screen name="present" options={{ title: 'Present Credential', presentation: 'modal' }} />
      <Stack.Screen name="scanner" options={{ title: 'Scan QR Code', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="history" options={{ title: 'Consent History' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile & Settings' }} />
      </Stack>
    </View>
  );
}
