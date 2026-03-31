import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const handleRegister = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName) { setError('Name is required.'); return; }
    if (!trimmedEmail) { setError('Email is required.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }

    setLoading(true);
    setError('');
    try {
      await register(trimmedEmail, password, trimmedName);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  }, [name, email, password, register, router]);

  const clearError = useCallback(() => setError(''), []);

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={s.brand}>
          <View style={s.iconBox}>
            <View style={s.iconInner}>
              <Text style={s.iconLock} accessibilityElementsHidden>&#x1F6E1;&#xFE0F;</Text>
            </View>
          </View>
          <Text style={s.title}>Create Account</Text>
          <Text style={s.subtitle}>Set up your TrustVault wallet</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={s.errorBox} accessibilityRole="alert">
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Name */}
        <Text style={s.label}>Full Name</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={(t) => { setName(t); clearError(); }}
          placeholder="Sandhya Sharma"
          placeholderTextColor="#6B7280"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          accessibilityLabel="Full name"
        />

        {/* Email */}
        <Text style={s.label}>Email</Text>
        <TextInput
          ref={emailRef}
          style={s.input}
          value={email}
          onChangeText={(t) => { setEmail(t); clearError(); }}
          placeholder="you@example.com"
          placeholderTextColor="#6B7280"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          accessibilityLabel="Email address"
        />

        {/* Password */}
        <Text style={s.label}>Password</Text>
        <TextInput
          ref={passwordRef}
          style={s.input}
          value={password}
          onChangeText={(t) => { setPassword(t); clearError(); }}
          placeholder="At least 6 characters"
          placeholderTextColor="#6B7280"
          secureTextEntry
          returnKeyType="go"
          onSubmitEditing={handleRegister}
          accessibilityLabel="Password"
        />

        <Text style={s.hint}>Role: Credential Holder (wallet user)</Text>

        {/* Submit */}
        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [s.button, (pressed || loading) && s.buttonPressed]}
          accessibilityRole="button"
          accessibilityLabel="Create account"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color="#0B1120" size="small" />
          ) : (
            <Text style={s.buttonText}>Create Account</Text>
          )}
        </Pressable>

        {/* Link to login */}
        <View style={s.footer}>
          <Text style={s.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={s.link}>Sign in</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0B1120' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 },
  brand: { alignItems: 'center', marginBottom: 36 },
  iconBox: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1, borderColor: 'rgba(20,184,166,0.2)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  iconInner: { width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(20,184,166,0.15)', alignItems: 'center', justifyContent: 'center' },
  iconLock: { fontSize: 22 },
  title: { color: '#F9FAFB', fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { color: '#6B7280', fontSize: 15, marginTop: 6 },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)',
  },
  errorText: { color: '#F87171', fontSize: 13, lineHeight: 18 },
  label: { color: '#9CA3AF', fontSize: 13, fontWeight: '500', marginBottom: 6, marginLeft: 2 },
  input: {
    backgroundColor: '#111827', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    color: '#F9FAFB', fontSize: 16, marginBottom: 18,
    borderWidth: 1, borderColor: '#1F2937',
  },
  hint: { color: '#4B5563', fontSize: 12, marginBottom: 20, marginLeft: 2 },
  button: {
    backgroundColor: '#14B8A6', borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', marginTop: 4, minHeight: 52,
  },
  buttonPressed: { backgroundColor: '#0D9488', opacity: 0.9 },
  buttonText: { color: '#0B1120', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  footerText: { color: '#6B7280', fontSize: 14 },
  link: { color: '#14B8A6', fontSize: 14, fontWeight: '600' },
});
