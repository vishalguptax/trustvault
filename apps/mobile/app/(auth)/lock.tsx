import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/lib/theme';
import { useLock } from '@/app/_layout';
import {
  verifyMpin,
  clearMpin,
  isBiometricAvailable,
  isBiometricEnabled,
  authenticateWithBiometric,
} from '@/lib/auth/lock-store';
import { clearRefreshToken } from '@/lib/auth/token-store';
import { AUTH } from '@/lib/routes';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 3;

export default function LockScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { unlock } = useLock();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const mountedRef = useRef(true);
  const attemptsRef = useRef(0);
  const unlockRef = useRef(unlock);

  // Keep unlock ref current
  useEffect(() => {
    unlockRef.current = unlock;
  }, [unlock]);

  useEffect(() => {
    console.log('[Lock] Screen mounted');
    return () => {
      console.log('[Lock] Screen unmounted');
      mountedRef.current = false;
    };
  }, []);

  // Check biometric availability on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('[Lock] Checking biometric availability...');
        const available = await isBiometricAvailable();
        const enabled = await isBiometricEnabled();
        console.log('[Lock] Biometric: available=', available, 'enabled=', enabled);
        if (cancelled) return;
        setBiometricReady(available && enabled);
      } catch (err) {
        console.warn('[Lock] Biometric check error:', err);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-trigger biometric prompt after a short delay to let auth refresh settle
  useEffect(() => {
    if (!biometricReady) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      try {
        console.log('[Lock] Auto-triggering biometric prompt...');
        const success = await authenticateWithBiometric();
        console.log('[Lock] Auto-biometric result:', success);
        if (cancelled) return;
        if (success) {
          console.log('[Lock] Biometric success → calling unlock()');
          unlockRef.current();
        }
      } catch (err) {
        console.warn('[Lock] Auto-biometric error:', err);
      }
    }, 800);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [biometricReady]);

  // Verify PIN when 4 digits are entered
  useEffect(() => {
    if (pin.length !== PIN_LENGTH) return;
    if (verifying) {
      console.log('[Lock] PIN ready but already verifying, skipping');
      return;
    }

    console.log('[Lock] PIN complete, starting verification...');
    setVerifying(true);

    const currentPin = pin;
    (async () => {
      try {
        console.log('[Lock] Calling verifyMpin...');
        const correct = await verifyMpin(currentPin);
        console.log('[Lock] verifyMpin returned:', correct);

        if (!mountedRef.current) {
          console.log('[Lock] Component unmounted during verification');
          return;
        }

        if (correct) {
          console.log('[Lock] PIN correct → calling unlock()');
          setError('');
          unlockRef.current();
          return;
        }

        console.log('[Lock] PIN incorrect');
        const newAttempts = attemptsRef.current + 1;
        attemptsRef.current = newAttempts;
        setAttempts(newAttempts);
        setPin('');
        setShaking(true);
        setTimeout(() => {
          if (mountedRef.current) setShaking(false);
        }, 400);

        if (newAttempts >= MAX_ATTEMPTS) {
          setError('Too many failed attempts. Please sign in again.');
          await clearMpin();
          await clearRefreshToken();
          router.replace(AUTH.LOGIN);
        } else {
          setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`);
        }
      } catch (err) {
        console.error('[Lock] PIN verify error:', err);
        if (mountedRef.current) {
          setError('Verification failed. Please try again.');
          setPin('');
        }
      } finally {
        if (mountedRef.current) {
          console.log('[Lock] Setting verifying=false');
          setVerifying(false);
        }
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleDigit = useCallback((digit: string) => {
    if (verifying) {
      console.log('[Lock] Digit ignored, verifying in progress');
      return;
    }
    setError('');
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + digit;
      console.log('[Lock] PIN digit added, length now:', next.length);
      return next;
    });
  }, [verifying]);

  const handleBackspace = useCallback(() => {
    if (verifying) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, [verifying]);

  const handleBiometric = useCallback(async () => {
    console.log('[Lock] Manual biometric tap...');
    try {
      const success = await authenticateWithBiometric();
      console.log('[Lock] Manual biometric result:', success);
      if (success) {
        console.log('[Lock] Biometric success → calling unlock()');
        unlockRef.current();
      } else {
        console.log('[Lock] Biometric returned false');
      }
    } catch (err) {
      console.warn('[Lock] Biometric error:', err);
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      {/* Lock icon */}
      <View
        style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: `${colors.primary}18`,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}
        accessibilityElementsHidden
      >
        <Ionicons name="lock-closed" size={32} color={colors.primary} />
      </View>

      <Text
        style={{ color: colors.foreground, fontSize: 22, fontWeight: '700', marginBottom: 8 }}
        accessibilityRole="header"
      >
        Unlock TrustVault
      </Text>
      <Text style={{ color: colors.mutedText, fontSize: 14, marginBottom: 32 }}>
        Enter your 4-digit PIN
      </Text>

      {/* PIN dots */}
      <View
        style={{
          flexDirection: 'row', justifyContent: 'center', marginBottom: 16,
          transform: shaking ? [{ translateX: 8 }] : [{ translateX: 0 }],
        }}
        accessibilityLabel={`PIN entry. ${pin.length} of ${PIN_LENGTH} digits entered.`}
        accessibilityRole="text"
      >
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 16, height: 16, borderRadius: 8,
              borderWidth: 2,
              borderColor: error ? colors.danger : colors.primary,
              backgroundColor: i < pin.length ? (error ? colors.danger : colors.primary) : 'transparent',
              marginHorizontal: 10,
            }}
          />
        ))}
      </View>

      {/* Error message */}
      <View style={{ minHeight: 24, marginBottom: 16, alignItems: 'center' }}>
        {error ? (
          <Text style={{ color: colors.danger, fontSize: 13, textAlign: 'center' }} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>

      {/* Number pad */}
      <View style={{ width: 240, alignItems: 'center' }}>
        {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, rowIndex) => (
          <View key={rowIndex} style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
            {row.map((digit) => (
              <Pressable
                key={digit}
                onPress={() => handleDigit(String(digit))}
                disabled={verifying}
                style={({ pressed }) => ({
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: pressed ? colors.muted : colors.surface,
                  alignItems: 'center', justifyContent: 'center',
                  marginHorizontal: 8,
                  opacity: (pressed || verifying) ? 0.5 : 1,
                })}
                accessibilityLabel={`Digit ${digit}`}
                accessibilityRole="button"
              >
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '600' }}>
                  {digit}
                </Text>
              </Pressable>
            ))}
          </View>
        ))}

        {/* Bottom row: biometric / 0 / backspace */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          {/* Biometric button */}
          <View style={{ width: 64, height: 64, marginHorizontal: 8, alignItems: 'center', justifyContent: 'center' }}>
            {biometricReady ? (
              <Pressable
                onPress={handleBiometric}
                style={({ pressed }) => ({
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: pressed ? colors.muted : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                  opacity: pressed ? 0.7 : 1,
                })}
                accessibilityLabel="Unlock with biometric"
                accessibilityRole="button"
              >
                <Ionicons name="finger-print" size={28} color={colors.primary} />
              </Pressable>
            ) : null}
          </View>

          {/* Zero */}
          <Pressable
            onPress={() => handleDigit('0')}
            disabled={verifying}
            style={({ pressed }) => ({
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: pressed ? colors.muted : colors.surface,
              borderWidth: 1, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
              marginHorizontal: 8,
              opacity: (pressed || verifying) ? 0.5 : 1,
            })}
            accessibilityLabel="Digit 0"
            accessibilityRole="button"
          >
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '600' }}>0</Text>
          </Pressable>

          {/* Backspace */}
          <Pressable
            onPress={handleBackspace}
            disabled={verifying}
            style={({ pressed }) => ({
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: pressed ? colors.muted : 'transparent',
              alignItems: 'center', justifyContent: 'center',
              marginHorizontal: 8,
              opacity: (pressed || verifying) ? 0.5 : 1,
            })}
            accessibilityLabel="Delete last digit"
            accessibilityRole="button"
          >
            <Ionicons name="backspace-outline" size={24} color={colors.mutedText} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
