import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '@/lib/theme';
import {
  verifyMpin,
  clearMpin,
  isBiometricAvailable,
  isBiometricEnabled,
  authenticateWithBiometric,
} from '@/lib/auth/lock-store';
import { clearRefreshToken } from '@/lib/auth/token-store';

const PIN_LENGTH = 4;
const MAX_ATTEMPTS = 3;

export default function LockScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [shaking, setShaking] = useState(false);
  const [biometricReady, setBiometricReady] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  // Check biometric availability and attempt on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      if (cancelled) return;
      const ready = available && enabled;
      setBiometricReady(ready);
      if (ready) {
        const success = await authenticateWithBiometric();
        if (cancelled) return;
        if (success) {
          handleUnlock();
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUnlock = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const handleForceLogin = useCallback(async () => {
    await clearMpin();
    await clearRefreshToken();
    router.replace('/(auth)/login');
  }, [router]);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => {
      if (mountedRef.current) setShaking(false);
    }, 400);
  }, []);

  const handlePinComplete = useCallback(async (fullPin: string) => {
    const correct = await verifyMpin(fullPin);
    if (correct) {
      setError('');
      handleUnlock();
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setPin('');
    triggerShake();

    if (newAttempts >= MAX_ATTEMPTS) {
      setError('Too many failed attempts. Please sign in again.');
      await handleForceLogin();
    } else {
      setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`);
    }
  }, [attempts, handleUnlock, handleForceLogin, triggerShake]);

  const handleDigit = useCallback((digit: string) => {
    setError('');
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + digit;
      if (next.length === PIN_LENGTH) {
        // Defer verification to next tick so state updates first
        setTimeout(() => handlePinComplete(next), 50);
      }
      return next;
    });
  }, [handlePinComplete]);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  const handleBiometric = useCallback(async () => {
    const success = await authenticateWithBiometric();
    if (success) {
      handleUnlock();
    }
  }, [handleUnlock]);

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
                style={({ pressed }) => ({
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: pressed ? colors.muted : colors.surface,
                  borderWidth: 1, borderColor: colors.border,
                  alignItems: 'center', justifyContent: 'center',
                  marginHorizontal: 8,
                  opacity: pressed ? 0.7 : 1,
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
            style={({ pressed }) => ({
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: pressed ? colors.muted : colors.surface,
              borderWidth: 1, borderColor: colors.border,
              alignItems: 'center', justifyContent: 'center',
              marginHorizontal: 8,
              opacity: pressed ? 0.7 : 1,
            })}
            accessibilityLabel="Digit 0"
            accessibilityRole="button"
          >
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '600' }}>0</Text>
          </Pressable>

          {/* Backspace */}
          <Pressable
            onPress={handleBackspace}
            style={({ pressed }) => ({
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: pressed ? colors.muted : 'transparent',
              alignItems: 'center', justifyContent: 'center',
              marginHorizontal: 8,
              opacity: pressed ? 0.7 : 1,
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
