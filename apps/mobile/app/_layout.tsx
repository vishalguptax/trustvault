import { useEffect, useState, useRef, useCallback, createContext, useContext } from 'react';
import { View, Text, ActivityIndicator, AppState, type AppStateStatus } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/auth/auth-context';
import { ThemeProvider, useTheme } from '@/lib/theme';
import { hasMpin, isLockEnabled } from '@/lib/auth/lock-store';
import { getRefreshToken } from '@/lib/auth/token-store';
import { wakeUpApi } from '@/lib/api';
import { AUTH, TABS } from '@/lib/routes';

const LockContext = createContext<{ unlock: () => void }>({ unlock: () => {} });
export function useLock() { return useContext(LockContext); }

function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const { colors, isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();
  const [isLocked, setIsLocked] = useState(false);
  const [lockChecked, setLockChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Wake up API on mount (cold start on free tier)
  useEffect(() => {
    wakeUpApi().then((ok) => {
      setApiReady(true);
      if (!ok) console.warn('[AuthGate] API not reachable on first try');
    });
  }, []);

  // Check lock state after auth loading completes
  useEffect(() => {
    if (isLoading || lockChecked) return;

    (async () => {
      const sessionExists = isAuthenticated || (await getRefreshToken()) !== null;
      setHasSession(sessionExists);
      console.log('[AuthGate] Lock check: isAuthenticated=', isAuthenticated, 'sessionExists=', sessionExists);

      if (!sessionExists) {
        console.log('[AuthGate] No session, skipping lock');
        setIsLocked(false);
        setLockChecked(true);
        return;
      }

      const [lockOn, pinExists] = await Promise.all([isLockEnabled(), hasMpin()]);
      const shouldLock = lockOn && pinExists;
      console.log('[AuthGate] lockEnabled=', lockOn, 'hasMpin=', pinExists, '→ shouldLock=', shouldLock);
      setIsLocked(shouldLock);
      setLockChecked(true);
    })();
  }, [isLoading, isAuthenticated, lockChecked]);

  // Lock when going to background
  useEffect(() => {
    const handleAppState = async (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/active/) && nextState.match(/inactive|background/)) {
        const sessionExists = isAuthenticated || (await getRefreshToken()) !== null;
        if (sessionExists) {
          const [lockOn, pinExists] = await Promise.all([isLockEnabled(), hasMpin()]);
          if (lockOn && pinExists) {
            console.log('[AuthGate] App backgrounded → locking');
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
    console.log('[AuthGate] unlock() called — setting isLocked=false');
    setIsLocked(false);
  }, []);

  // Navigation routing
  useEffect(() => {
    if (isLoading || !lockChecked) return;
    const inAuthGroup = segments[0] === '(auth)';
    const onLockScreen = segments[0] === '(auth)' && segments[1] === 'lock';
    const onSetupMpin = segments[0] === '(auth)' && segments[1] === 'setup-mpin';
    const loggedIn = isAuthenticated || hasSession;

    console.log('[AuthGate] Route check: loggedIn=', loggedIn, 'isLocked=', isLocked,
      'inAuthGroup=', inAuthGroup, 'onLockScreen=', onLockScreen,
      'segments=', segments.join('/'));

    if (!loggedIn && !isLocked) {
      if (!inAuthGroup || onLockScreen) {
        console.log('[AuthGate] → navigate to login');
        router.replace(AUTH.LOGIN);
      }
    } else if (isLocked && !onLockScreen) {
      console.log('[AuthGate] → navigate to lock');
      router.replace(AUTH.LOCK);
    } else if (loggedIn && !isLocked && inAuthGroup && !onSetupMpin) {
      console.log('[AuthGate] → navigate to tabs');
      router.replace(TABS.HOME);
    } else {
      console.log('[AuthGate] → no navigation needed');
    }
  }, [isAuthenticated, hasSession, isLoading, isLocked, lockChecked, segments, router]);

  if (isLoading || !lockChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: `${colors.primary}14`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        {!apiReady && (
          <Text style={{ color: colors.mutedText, fontSize: 13, marginTop: 4 }}>
            Connecting to server...
          </Text>
        )}
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
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AuthGate />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
