import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { API_BASE_URL } from '@/lib/constants';
import { ConfirmSheet } from '@/components/confirm-sheet';
import { AUTH } from '@/lib/routes';
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
  const shadow = isDark ? cardShadowDark : cardShadow;

  const [lockOn, setLockOn] = useState(false);
  const [pinExists, setPinExists] = useState(false);
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [showRemovePin, setShowRemovePin] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // Load and refresh security state on every screen focus (including return from setup-mpin)
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        const [lo, pe, ba, be] = await Promise.all([
          isLockEnabled(), hasMpin(), isBiometricAvailable(), isBiometricEnabled(),
        ]);
        if (cancelled) return;
        setLockOn(lo);
        setPinExists(pe);
        setBioAvailable(ba);
        setBioEnabled(be);
      })();
      return () => { cancelled = true; };
    }, []),
  );

  const handleToggleLock = useCallback(async () => {
    if (!pinExists) {
      // No PIN yet — go set one up
      router.push({ pathname: AUTH.SETUP_MPIN, params: { returnTo: 'profile' } });
      return;
    }
    const newValue = !lockOn;
    await setLockEnabled(newValue);
    setLockOn(newValue);
  }, [lockOn, pinExists, router]);

  const handleChangePin = useCallback(() => {
    router.push({ pathname: AUTH.SETUP_MPIN, params: { mode: 'change', returnTo: 'profile' } });
  }, [router]);

  const handleToggleBiometric = useCallback(async () => {
    const newValue = !bioEnabled;
    await setBiometricEnabled(newValue);
    setBioEnabled(newValue);
  }, [bioEnabled]);

  const handleRemovePin = useCallback(async () => {
    await clearMpin();
    setLockOn(false);
    setPinExists(false);
    setBioEnabled(false);
    setShowRemovePin(false);
  }, []);

  const handleLogout = useCallback(async () => {
    setShowLogout(false);
    await logout();
    router.replace(AUTH.LOGIN);
  }, [logout, router]);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
    >
      {/* User card */}
      <View style={{ backgroundColor: colors.surface, borderRadius: 18, padding: 20, marginBottom: 20, ...shadow }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
          <View style={{
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: `${colors.primary}18`,
            alignItems: 'center', justifyContent: 'center', marginRight: 16,
          }}>
            <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '700' }}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '600' }}>
              {user?.name ?? 'User'}
            </Text>
            <Text style={{ color: colors.mutedText, fontSize: 13, marginTop: 3 }}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 }}>
          <Text style={{ color: colors.mutedText, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
            Role
          </Text>
          <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', textTransform: 'capitalize' }}>
            {user?.role ?? 'holder'}
          </Text>
        </View>

        {user?.id ? (
          <View style={{ backgroundColor: colors.muted, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginTop: 8 }}>
            <Text style={{ color: colors.mutedText, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
              User ID
            </Text>
            <Text style={{ color: colors.mutedText, fontSize: 12, fontFamily: 'monospace' }} numberOfLines={1}>
              {user.id}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Preferences */}
      <SectionLabel colors={colors}>Preferences</SectionLabel>
      <View style={{ backgroundColor: colors.surface, borderRadius: 18, marginBottom: 20, overflow: 'hidden', ...shadow }}>
        <ToggleRow
          label="Dark Mode"
          value={isDark}
          onPress={toggleTheme}
          colors={colors}
        />
      </View>

      {/* Security */}
      <SectionLabel colors={colors}>Security</SectionLabel>
      <View style={{ backgroundColor: colors.surface, borderRadius: 18, marginBottom: 20, overflow: 'hidden', ...shadow }}>
        <ToggleRow
          label="App Lock"
          value={lockOn}
          onPress={handleToggleLock}
          colors={colors}
        />

        {pinExists && (
          <>
            <Divider colors={colors} />
            <ActionRow
              label="Change PIN"
              icon="key-outline"
              onPress={handleChangePin}
              colors={colors}
            />

            {bioAvailable && (
              <>
                <Divider colors={colors} />
                <ToggleRow
                  label="Use Biometric"
                  value={bioEnabled}
                  onPress={handleToggleBiometric}
                  colors={colors}
                />
              </>
            )}

            <Divider colors={colors} />
            <ActionRow
              label="Remove PIN"
              icon="trash-outline"
              onPress={() => setShowRemovePin(true)}
              colors={colors}
              destructive
            />
          </>
        )}
      </View>

      {/* About */}
      <SectionLabel colors={colors}>About</SectionLabel>
      <View style={{ backgroundColor: colors.surface, borderRadius: 18, marginBottom: 28, overflow: 'hidden', ...shadow }}>
        <InfoRow label="API Server" value={API_BASE_URL} colors={colors} />
        <Divider colors={colors} />
        <InfoRow label="App Version" value="0.1.0" colors={colors} />
        <Divider colors={colors} />
        <InfoRow label="SDK" value="Expo SDK 55" colors={colors} />
      </View>

      {/* Sign out */}
      <Pressable
        onPress={() => setShowLogout(true)}
        style={({ pressed }) => ({
          backgroundColor: pressed ? `${colors.danger}20` : `${colors.danger}12`,
          borderRadius: 16, paddingVertical: 15,
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'row', gap: 8, minHeight: 48,
        })}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={{ color: colors.danger, fontWeight: '600', fontSize: 15 }}>Sign Out</Text>
      </Pressable>

      {/* Confirm sheets */}
      <ConfirmSheet
        visible={showRemovePin}
        title="Remove PIN"
        message="This will remove your PIN and disable app lock. You can set a new PIN afterwards."
        confirmLabel="Remove"
        destructive
        onConfirm={handleRemovePin}
        onCancel={() => setShowRemovePin(false)}
      />
      <ConfirmSheet
        visible={showLogout}
        title="Sign Out"
        message="Are you sure you want to sign out? You will need to log in again."
        confirmLabel="Sign Out"
        destructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </ScrollView>
  );
}

// ── Reusable row components ──

function SectionLabel({ colors, children }: { colors: { mutedText: string }; children: string }) {
  return (
    <Text style={{
      color: colors.mutedText, fontSize: 12, fontWeight: '600',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginLeft: 4,
    }}>
      {children}
    </Text>
  );
}

function Divider({ colors }: { colors: { border: string } }) {
  return <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 18 }} />;
}

function ToggleRow({ label, value, onPress, colors }: {
  label: string; value: boolean; onPress: () => void;
  colors: { foreground: string; primary: string; muted: string; surface: string; border: string };
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 18, paddingVertical: 15,
        backgroundColor: pressed ? colors.muted : 'transparent',
      })}
      accessibilityLabel={`${label}: ${value ? 'on' : 'off'}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Text style={{ color: colors.foreground, fontSize: 15 }}>{label}</Text>
      <View style={{
        width: 46, height: 28, borderRadius: 14,
        backgroundColor: value ? colors.primary : colors.border,
        justifyContent: 'center', paddingHorizontal: 2,
      }}>
        <View style={{
          width: 24, height: 24, borderRadius: 12,
          backgroundColor: '#FFFFFF',
          alignSelf: value ? 'flex-end' : 'flex-start',
        }} />
      </View>
    </Pressable>
  );
}

function ActionRow({ label, icon, onPress, colors, destructive = false }: {
  label: string; icon: string; onPress: () => void;
  colors: { foreground: string; muted: string; mutedText: string; danger: string };
  destructive?: boolean;
}) {
  const textColor = destructive ? colors.danger : colors.foreground;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 18, paddingVertical: 15,
        backgroundColor: pressed ? colors.muted : 'transparent', minHeight: 48,
      })}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={textColor} style={{ marginRight: 12 }} />
      <Text style={{ color: textColor, fontSize: 15, flex: 1 }}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.mutedText} />
    </Pressable>
  );
}

function InfoRow({ label, value, colors }: {
  label: string; value: string; colors: { foreground: string; mutedText: string };
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13 }}>
      <Text style={{ color: colors.mutedText, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: 'monospace' }} numberOfLines={1}>{value}</Text>
    </View>
  );
}
