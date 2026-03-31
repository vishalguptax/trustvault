import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={s.splash}>
        <View style={s.splashIcon}>
          <ActivityIndicator size="large" color="#14B8A6" />
        </View>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B1120' },
  splash: { flex: 1, backgroundColor: '#0B1120', alignItems: 'center', justifyContent: 'center' },
  splashIcon: { width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(20,184,166,0.1)', alignItems: 'center', justifyContent: 'center' },
});
