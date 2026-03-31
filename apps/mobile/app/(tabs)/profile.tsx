import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme } from '@/lib/theme';
import { API_BASE_URL } from '@/lib/constants';
import {
  hasMpin,
  isLockEnabled,
  setLockEnabled,
  isBiometricAvailable,
  isBiometricEnabled,
  setBiometricEnabled,
  clearMpin,
} from '@/lib/auth/lock-store';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();

  const [lockOn, setLockOn] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [le, mp, ba, be] = await Promise.all([
        isLockEnabled(),
        hasMpin(),
        isBiometricAvailable(),
        isBiometricEnabled(),
      ]);
      if (cancelled) return;
      setLockOn(le);
      setPinExists(mp);
      setBioAvailable(ba);
      setBioEnabled(be);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleToggleLock = useCallback(async () => {
    if (!pinExists) {
      // No PIN set yet — navigate to setup
      router.push('/(auth)/setup-mpin');
      return;
    }
    const newValue = !lockOn;
    await setLockEnabled(newValue);
    setLockOn(newValue);
  }, [lockOn, pinExists, router]);

  const handleChangePin = useCallback(() => {
    router.push('/(auth)/setup-mpin');
  }, [router]);

  const handleToggleBiometric = useCallback(async () => {
    const newValue = !bioEnabled;
    await setBiometricEnabled(newValue);
    setBioEnabled(newValue);
  }, [bioEnabled]);

  const handleResetPin = useCallback(() => {
    Alert.alert(
      'Reset PIN',
      'This will remove your PIN and disable app lock. You can set a new PIN afterwards.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearMpin();
            setLockOn(false);
            setPinExists(false);
            setBioEnabled(false);
          },
        },
      ],
    );
  }, []);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
    >
      {/* User card */}
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: `${colors.primary}20`,
            alignItems: 'center', justifyContent: 'center',
            marginRight: 14,
          }}>
            <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '700' }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '600' }}>
              {user?.name ?? 'User'}
            </Text>
            <Text style={{ color: colors.mutedText, fontSize: 13, marginTop: 2 }}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>

        <View style={{
          backgroundColor: colors.muted,
          borderRadius: 8,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}>
          <Text style={{ color: colors.mutedText, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
            Role
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' }}>
            {user?.role ?? 'holder'}
          </Text>
        </View>

        {user?.id ? (
          <View style={{
            backgroundColor: colors.muted,
            borderRadius: 8,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginTop: 8,
          }}>
            <Text style={{ color: colors.mutedText, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
              User ID
            </Text>
            <Text style={{ color: colors.mutedText, fontSize: 12, fontFamily: 'monospace' }} numberOfLines={1}>
              {user.id}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Settings section */}
      <Text style={{ color: colors.mutedText, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
        Preferences
      </Text>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        {/* Theme toggle */}
        <Pressable
          onPress={toggleTheme}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: pressed ? colors.muted : 'transparent',
          })}
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          accessibilityRole="switch"
          accessibilityState={{ checked: isDark }}
        >
          <Text style={{ color: colors.foreground, fontSize: 15 }}>Dark Mode</Text>
          <View style={{
            width: 44, height: 26, borderRadius: 13,
            backgroundColor: isDark ? colors.primary : colors.muted,
            justifyContent: 'center',
            paddingHorizontal: 2,
          }}>
            <View style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: colors.surface,
              alignSelf: isDark ? 'flex-end' : 'flex-start',
            }} />
          </View>
        </Pressable>
      </View>

      {/* App Lock section */}
      <Text style={{ color: colors.mutedText, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
        Security
      </Text>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16,
        overflow: 'hidden',
      }}>
        {/* Lock toggle */}
        <Pressable
          onPress={handleToggleLock}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: pressed ? colors.muted : 'transparent',
          })}
          accessibilityLabel={lockOn ? 'Disable app lock' : 'Enable app lock'}
          accessibilityRole="switch"
          accessibilityState={{ checked: lockOn }}
        >
          <Text style={{ color: colors.foreground, fontSize: 15 }}>App Lock</Text>
          <View style={{
            width: 44, height: 26, borderRadius: 13,
            backgroundColor: lockOn ? colors.primary : colors.muted,
            justifyContent: 'center',
            paddingHorizontal: 2,
          }}>
            <View style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: colors.surface,
              alignSelf: lockOn ? 'flex-end' : 'flex-start',
            }} />
          </View>
        </Pressable>

        {pinExists ? (
          <>
            <View style={{ height: 1, backgroundColor: colors.border }} />
            {/* Change PIN */}
            <Pressable
              onPress={handleChangePin}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
              accessibilityLabel="Change PIN"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.foreground, fontSize: 15 }}>Change PIN</Text>
              <Text style={{ color: colors.mutedText, fontSize: 18 }}>{'>'}</Text>
            </Pressable>

            {/* Biometric toggle — only if hardware supports it */}
            {bioAvailable ? (
              <>
                <View style={{ height: 1, backgroundColor: colors.border }} />
                <Pressable
                  onPress={handleToggleBiometric}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    backgroundColor: pressed ? colors.muted : 'transparent',
                  })}
                  accessibilityLabel={bioEnabled ? 'Disable biometric unlock' : 'Enable biometric unlock'}
                  accessibilityRole="switch"
                  accessibilityState={{ checked: bioEnabled }}
                >
                  <Text style={{ color: colors.foreground, fontSize: 15 }}>Use Biometric</Text>
                  <View style={{
                    width: 44, height: 26, borderRadius: 13,
                    backgroundColor: bioEnabled ? colors.primary : colors.muted,
                    justifyContent: 'center',
                    paddingHorizontal: 2,
                  }}>
                    <View style={{
                      width: 22, height: 22, borderRadius: 11,
                      backgroundColor: colors.surface,
                      alignSelf: bioEnabled ? 'flex-end' : 'flex-start',
                    }} />
                  </View>
                </Pressable>
              </>
            ) : null}

            <View style={{ height: 1, backgroundColor: colors.border }} />
            {/* Reset PIN */}
            <Pressable
              onPress={handleResetPin}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 14,
                backgroundColor: pressed ? colors.muted : 'transparent',
              })}
              accessibilityLabel="Reset PIN"
              accessibilityRole="button"
            >
              <Text style={{ color: colors.danger, fontSize: 15 }}>Reset PIN</Text>
            </Pressable>
          </>
        ) : null}
      </View>

      {/* Info section */}
      <Text style={{ color: colors.mutedText, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 }}>
        About
      </Text>
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 24,
        overflow: 'hidden',
      }}>
        <InfoRow label="API Server" value={API_BASE_URL} colors={colors} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <InfoRow label="App Version" value="0.1.0" colors={colors} />
        <View style={{ height: 1, backgroundColor: colors.border }} />
        <InfoRow label="SDK" value="Expo SDK 55" colors={colors} />
      </View>

      {/* Sign out */}
      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => ({
          backgroundColor: `${colors.danger}12`,
          borderWidth: 1,
          borderColor: `${colors.danger}30`,
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          minHeight: 48,
          opacity: pressed ? 0.8 : 1,
        })}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 15 }}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: Record<string, string> }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
      <Text style={{ color: colors.mutedText, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: 'monospace' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}
