import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/lib/theme';
import { setMpin, setLockEnabled, verifyMpin } from '@/lib/auth/lock-store';
import { TABS } from '@/lib/routes';

const PIN_LENGTH = 4;

type Step = 'verify' | 'create' | 'confirm';

export default function SetupMpinScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { mode, returnTo } = useLocalSearchParams<{ mode?: string; returnTo?: string }>();
  const isChange = mode === 'change';

  const [step, setStep] = useState<Step>(isChange ? 'verify' : 'create');
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const navigateBack = useCallback(() => {
    if (returnTo === 'profile') {
      router.back();
    } else {
      router.replace(TABS.HOME);
    }
  }, [returnTo, router]);

  // Handle PIN completion via useEffect (no setTimeout in state updater)
  useEffect(() => {
    if (pin.length !== PIN_LENGTH || processing) return;
    setProcessing(true);

    (async () => {
      try {
        if (step === 'verify') {
          const correct = await verifyMpin(pin);
          if (!mountedRef.current) return;
          if (correct) {
            setPin('');
            setError('');
            setStep('create');
          } else {
            setPin('');
            setError('Incorrect PIN. Please try again.');
            setShaking(true);
            setTimeout(() => { if (mountedRef.current) setShaking(false); }, 400);
          }
        } else if (step === 'create') {
          setFirstPin(pin);
          setPin('');
          setError('');
          setStep('confirm');
        } else {
          // confirm step
          if (pin !== firstPin) {
            setPin('');
            setFirstPin('');
            setError('PINs do not match. Please try again.');
            setShaking(true);
            setTimeout(() => { if (mountedRef.current) setShaking(false); }, 400);
            setStep('create');
          } else {
            await setMpin(pin);
            await setLockEnabled(true);
            if (mountedRef.current) navigateBack();
          }
        }
      } finally {
        if (mountedRef.current) setProcessing(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleDigit = useCallback((digit: string) => {
    if (processing) return;
    setError('');
    setPin((prev) => {
      if (prev.length >= PIN_LENGTH) return prev;
      return prev + digit;
    });
  }, [processing]);

  const handleBackspace = useCallback(() => {
    if (processing) return;
    setPin((prev) => prev.slice(0, -1));
    setError('');
  }, [processing]);

  const title = step === 'verify'
    ? 'Enter Current PIN'
    : step === 'create'
      ? (isChange ? 'New PIN' : 'Secure Your Wallet')
      : 'Confirm Your PIN';

  const subtitle = step === 'verify'
    ? 'Verify your current PIN to continue'
    : step === 'create'
      ? (isChange ? 'Enter a new 4-digit PIN' : 'Create a 4-digit PIN to protect your credentials')
      : 'Re-enter your PIN to confirm';

  const stepCount = isChange ? 3 : 2;
  const currentStep = step === 'verify' ? 0 : step === 'create' ? (isChange ? 1 : 0) : (isChange ? 2 : 1);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
      {/* Back / Skip button */}
      <View style={{ position: 'absolute', top: 56, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
        <Pressable
          onPress={navigateBack}
          style={({ pressed }) => ({
            minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center',
            opacity: pressed ? 0.6 : 1,
          })}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </Pressable>
        {!isChange && (
          <Pressable
            onPress={navigateBack}
            style={({ pressed }) => ({
              minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center',
              opacity: pressed ? 0.6 : 1,
            })}
            accessibilityLabel="Skip PIN setup"
            accessibilityRole="button"
          >
            <Text style={{ color: colors.mutedText, fontSize: 14, fontWeight: '500' }}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Icon */}
      <View
        style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: `${colors.primary}18`,
          alignItems: 'center', justifyContent: 'center', marginBottom: 24,
        }}
        accessibilityElementsHidden
      >
        <Ionicons
          name={step === 'verify' ? 'lock-closed' : 'shield-checkmark'}
          size={32}
          color={colors.primary}
        />
      </View>

      <Text
        style={{ color: colors.foreground, fontSize: 22, fontWeight: '700', marginBottom: 8 }}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <Text style={{ color: colors.mutedText, fontSize: 14, marginBottom: 32, textAlign: 'center' }}>
        {subtitle}
      </Text>

      {/* Step indicator */}
      <View style={{ flexDirection: 'row', marginBottom: 24, gap: 8 }}>
        {Array.from({ length: stepCount }).map((_, i) => (
          <View key={i} style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: i <= currentStep ? colors.primary : colors.muted,
          }} />
        ))}
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
              width: 16, height: 16, borderRadius: 8, borderWidth: 2,
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
                disabled={processing}
                style={({ pressed }) => ({
                  width: 64, height: 64, borderRadius: 32,
                  backgroundColor: pressed ? colors.muted : colors.surface,
                  alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
                  opacity: (pressed || processing) ? 0.5 : 1,
                })}
                accessibilityLabel={`Digit ${digit}`}
                accessibilityRole="button"
              >
                <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '600' }}>{digit}</Text>
              </Pressable>
            ))}
          </View>
        ))}

        <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
          <View style={{ width: 64, height: 64, marginHorizontal: 8 }} />
          <Pressable
            onPress={() => handleDigit('0')}
            disabled={processing}
            style={({ pressed }) => ({
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: pressed ? colors.muted : colors.surface,
              alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
              opacity: (pressed || processing) ? 0.5 : 1,
            })}
            accessibilityLabel="Digit 0"
            accessibilityRole="button"
          >
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '600' }}>0</Text>
          </Pressable>
          <Pressable
            onPress={handleBackspace}
            disabled={processing}
            style={({ pressed }) => ({
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: pressed ? colors.muted : 'transparent',
              alignItems: 'center', justifyContent: 'center', marginHorizontal: 8,
              opacity: (pressed || processing) ? 0.5 : 1,
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
