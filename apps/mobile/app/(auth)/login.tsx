import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { TABS } from '@/lib/routes';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, isDark } = useTheme();
  const shadow = isDark ? cardShadowDark : cardShadow;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const handleLogin = useCallback(async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(trimmedEmail, password);
      router.replace(TABS.HOME);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }, [email, password, login, router]);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        {/* Brand */}
        <View style={{ alignItems: 'center', marginBottom: 40 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: `${colors.primary}14`,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
          </View>
          <Text style={{ color: colors.foreground, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 }}>Welcome Back</Text>
          <Text style={{ color: colors.mutedText, fontSize: 15, marginTop: 8, lineHeight: 22 }}>Sign in to your TrustVault wallet</Text>
        </View>

        {/* Error */}
        {error ? (
          <View style={{
            backgroundColor: colors.dangerLight, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
            borderWidth: 1, borderColor: 'rgba(239,68,68,0.18)',
          }} accessibilityRole="alert">
            <Text style={{ color: colors.danger, fontSize: 13, lineHeight: 18 }}>{error}</Text>
          </View>
        ) : null}

        {/* Email */}
        <Text style={{ color: colors.mutedText, fontSize: 13, fontWeight: '500', marginBottom: 8, marginLeft: 4 }}>Email</Text>
        <TextInput
          style={{
            backgroundColor: colors.inputBg, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15,
            color: colors.foreground, fontSize: 16, marginBottom: 20,
            ...shadow,
          }}
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          placeholder="you@example.com"
          placeholderTextColor={colors.placeholder}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          accessibilityLabel="Email address"
        />

        {/* Password */}
        <Text style={{ color: colors.mutedText, fontSize: 13, fontWeight: '500', marginBottom: 8, marginLeft: 4 }}>Password</Text>
        <View style={{ position: 'relative', marginBottom: 20 }}>
          <TextInput
            ref={passwordRef}
            style={{
              backgroundColor: colors.inputBg, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 15,
              paddingRight: 50, color: colors.foreground, fontSize: 16,
              ...shadow,
            }}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            placeholder="Enter your password"
            placeholderTextColor={colors.placeholder}
            secureTextEntry={!showPassword}
            returnKeyType="go"
            onSubmitEditing={handleLogin}
            accessibilityLabel="Password"
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            style={{
              position: 'absolute', right: 4, top: 0, bottom: 0,
              width: 44, alignItems: 'center', justifyContent: 'center',
            }}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityRole="button"
          >
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.mutedText} />
          </Pressable>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleLogin}
          disabled={loading}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            borderRadius: 16, paddingVertical: 16,
            alignItems: 'center', marginTop: 8, minHeight: 52,
            opacity: (pressed || loading) ? 0.9 : 1,
            ...shadow,
          })}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
          accessibilityState={{ disabled: loading }}
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryFg} size="small" />
          ) : (
            <Text style={{ color: colors.primaryFg, fontWeight: '700', fontSize: 16, letterSpacing: 0.2 }}>Sign In</Text>
          )}
        </Pressable>

        {/* Link to register */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: colors.mutedText, fontSize: 14 }}>No account? </Text>
          <Link href="/(auth)/register" asChild>
            <Pressable accessibilityRole="link" style={{ minHeight: 44, justifyContent: 'center' }}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Create one</Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
