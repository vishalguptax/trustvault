import { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import { View, ActivityIndicator, AppState, type AppStateStatus } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { hasMpin, isLockEnabled } from '@/lib/auth/lock-store';
import { getRefreshToken } from '@/lib/auth/token-store';

const LockContext = createContext<{ unlock: () => void }>({ unlock: () => {} });
export function useLock() { return useContext(LockContext); }

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const justUnlockedRef = useRef(false);

  // Check lock state after auth loading completes
  useEffect(() => {
    if (isLoading || lockChecked) return;

    (async () => {
      // Check if user has a session (even if refresh failed due to network)
      const hasSession = isAuthenticated || (await getRefreshToken()) !== null;

      if (!hasSession) {
        setIsLocked(false);
        setLockChecked(true);
        return;
      }

      const [lockOn, pinExists] = await Promise.all([isLockEnabled(), hasMpin()]);
      const shouldLock = lockOn && pinExists;
      setIsLocked(shouldLock);
      setLockChecked(true);
    })();
  }, [isLoading, isAuthenticated, lockChecked]);

  // Lock when going to background
  useEffect(() => {
    const handleAppState = async (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/active/) && nextState.match(/inactive|background/)) {
        const hasSession = isAuthenticated || (await getRefreshToken()) !== null;
        if (hasSession) {
          const [lockOn, pinExists] = await Promise.all([isLockEnabled(), hasMpin()]);
          if (lockOn && pinExists) {
            justUnlockedRef.current = false;
            setIsLocked(true);
          }
        }
      }
      appStateRef.current = nextState;
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated]);

  const unlock = useCallback(() => {
    justUnlockedRef.current = true;
    setIsLocked(false);
  }, []);

  // Navigation routing
  useEffect(() => {
    if (isLoading || !lockChecked) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onLockScreen = segments[0] === '(auth)' && segments[1] === 'lock';
    const onSetupMpin = segments[0] === '(auth)' && segments[1] === 'setup-mpin';

    if (!isAuthenticated && !isLocked && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isLocked && !onLockScreen) {
      router.replace('/(auth)/lock');
    } else if (isAuthenticated && !isLocked && inAuthGroup && !onSetupMpin) {
      if (!onLockScreen || justUnlockedRef.current) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, isLocked, lockChecked, segments, router]);

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
      <LockContext.Provider value={{ unlock }}>
        <Slot />
      </LockContext.Provider>
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
