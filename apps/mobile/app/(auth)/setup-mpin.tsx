import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { setMpin, setLockEnabled } from '@/lib/auth/lock-store';

const PIN_LENGTH = 4;

type Step = 'create' | 'confirm';

export default function SetupMpinScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [step, setStep] = useState<Step>('create');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => {
      if (mountedRef.current) setShaking(false);
    }, 400);
  }, []);

  const handlePinComplete = useCallback(async (fullPin: string) => {
    if (step === 'create') {
      setFirstPin(fullPin);
      setPin('');
      setError('');
      setStep('confirm');
      return;
    }

    // Confirm step
    if (fullPin !== firstPin) {
      setPin('');
      setError('PINs do not match. Please try again.');
      triggerShake();
      setStep('create');
      setFirstPin('');
      return;
    }

    // Match: store and proceed
    await setMpin(fullPin);
    await setLockEnabled(true);
    router.replace('/(tabs)');
  }, [step, firstPin, triggerShake, router]);

  const handleDigit = useCallback((digit: string) => {
    setError('');
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      const next = prev + digit;
      if (next.length === PIN_LENGTH) {
        setTimeout(() => handlePinComplete(next), 50);
      }
      return next;
    });
  }, [handlePinComplete]);

  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, []);

  const handleSkip = useCallback(() => {
    router.replace('/(tabs)');
  }, [router]);

  const title = step === 'create' ? 'Create a 4-digit PIN' : 'Confirm your PIN';
  const subtitle = step === 'create'
    ? 'This PIN will lock your wallet'
    : 'Re-enter your PIN to confirm';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      {/* Skip button */}
      <Pressable
        onPress={handleSkip}
        style={({ pressed }) => ({
          position: 'absolute', top: 56, right: 24,
          minHeight: 44, minWidth: 44,
          justifyContent: 'center', alignItems: 'center',
          opacity: pressed ? 0.6 : 1,
        })}
        accessibilityLabel="Skip PIN setup"
        accessibilityRole="button"
      >
        <Text style={{ color: colors.mutedText, fontSize: 15, fontWeight: '500' }}>Skip</Text>
      </Pressable>

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
        <Ionicons name="shield-checkmark" size={32} color={colors.primary} />
      </View>

      <Text
        style={{ color: colors.foreground, fontSize: 22, fontWeight: '700', marginBottom: 8 }}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text style={{ color: colors.mutedText, fontSize: 14, marginBottom: 32 }}>
        {subtitle}
      </Text>

      {/* Step indicator */}
      <View style={{ flexDirection: 'row', marginBottom: 24 }}>
        <View style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: colors.primary,
          marginHorizontal: 4,
        }} />
        <View style={{
          width: 8, height: 8, borderRadius: 4,
          backgroundColor: step === 'confirm' ? colors.primary : colors.muted,
          marginHorizontal: 4,
        }} />
      </View>

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

        {/* Bottom row: empty / 0 / backspace */}
        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ width: 64, height: 64, marginHorizontal: 8 }} />

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
