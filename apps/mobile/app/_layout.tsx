import { useEffect, useState, useRef, useCallback } from 'react';
import { View, ActivityIndicator, AppState, type AppStateStatus } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { hasMpin, isLockEnabled } from '@/lib/auth/lock-store';

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Check lock state after session restore
  const checkLockState = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLocked(false);
      setLockChecked(true);
      return;
    }
    const [lockOn, pinExists] = await Promise.all([isLockEnabled(), hasMpin()]);
    const shouldLock = lockOn && pinExists;
    setIsLocked(shouldLock);
    setLockChecked(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isLoading) {
      checkLockState();
    }
  }, [isLoading, isAuthenticated, checkLockState]);

  // Lock on background
  useEffect(() => {
    const handleAppState = async (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/active/) && nextState.match(/inactive|background/)) {
        // Going to background: mark locked if lock is enabled
        if (isAuthenticated) {
          const [lockOn, pinExists] = await Promise.all([isLockEnabled(), hasMpin()]);
          if (lockOn && pinExists) {
            setIsLocked(true);
          }
        }
      }
      appStateRef.current = nextState;
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isLoading || !lockChecked) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onLockScreen = segments[0] === '(auth)' && segments[1] === 'lock';
    const onSetupMpin = segments[0] === '(auth)' && segments[1] === 'setup-mpin';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && isLocked && !onLockScreen) {
      router.replace('/(auth)/lock');
    } else if (isAuthenticated && !isLocked && inAuthGroup && !onSetupMpin) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, isLocked, lockChecked, segments, router]);

  // Expose unlock function via callback in lock screen
  // The lock screen navigates to /(tabs) which triggers the effect above
  // to recognize isAuthenticated && !isLocked && not in auth group => no redirect needed

  // Listen for navigation to /(tabs) from lock screen — clear lock state
  useEffect(() => {
    const inTabs = segments[0] === '(tabs)';
    if (inTabs && isLocked) {
      setIsLocked(false);
    }
  }, [segments, isLocked]);

  if (isLoading || !lockChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 20, backgroundColor: 'rgba(20,184,166,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Slot />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
