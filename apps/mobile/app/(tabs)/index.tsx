import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { impactMedium } from '@/lib/haptics';
import { CredentialCard } from '@/components/credential-card';
import { EmptyState } from '@/components/empty-state';
import { useCredentials } from '@/hooks/use-credentials';
import { useAuth } from '@/lib/auth/auth-context';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { TABS } from '@/lib/routes';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function WalletHome() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { credentials, loading, error, refresh } = useCredentials();
  const [refreshing, setRefreshing] = useState(false);
  const shadow = isDark ? cardShadowDark : cardShadow;
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleFabPress = useCallback(() => {
    impactMedium();
    router.push(TABS.SCANNER);
  }, [router]);

  // Deduplicate
  const uniqueCredentials = useMemo(() => {
    return credentials.filter(
      (cred, index, self) => self.findIndex((c) => c.id === cred.id) === index,
    );
  }, [credentials]);

  const activeCount = uniqueCredentials.filter((c) => c.status === 'active').length;

  // Last 3 recent credentials (sorted by issuedAt desc)
  const recentCredentials = useMemo(() => {
    return [...uniqueCredentials]
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .slice(0, 3);
  }, [uniqueCredentials]);

  if (loading && uniqueCredentials.length === 0 && !error) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedText, fontSize: 14, marginTop: 12 }}>
          Loading credentials...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      >
        {/* Greeting */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <View>
            <Text style={{ color: colors.mutedText, fontSize: 14 }}>
              {getGreeting()},
            </Text>
            <Text style={{ color: colors.foreground, fontSize: 24, fontWeight: '700', marginTop: 2 }}>
              {firstName}
            </Text>
          </View>
          <Text style={{ color: colors.mutedText, fontSize: 12 }}>
            {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <Pressable
            onPress={() => router.push(TABS.CREDENTIALS)}
            style={({ pressed }) => ({
              flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: colors.border,
              opacity: pressed ? 0.9 : 1,
            })}
            accessibilityLabel={`${uniqueCredentials.length} total credentials. Tap to view all.`}
            accessibilityRole="button"
          >
            <View style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: `${colors.primary}14`, alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Ionicons name="wallet-outline" size={18} color={colors.primary} />
            </View>
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '700' }}>
              {uniqueCredentials.length}
            </Text>
            <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 2 }}>
              Total Credentials
            </Text>
          </Pressable>

          <View style={{
            flex: 1, backgroundColor: colors.surface, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: colors.border,
          }}>
            <View style={{
              width: 36, height: 36, borderRadius: 12,
              backgroundColor: `${colors.success}14`, alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            </View>
            <Text style={{ color: colors.foreground, fontSize: 22, fontWeight: '700' }}>
              {activeCount}
            </Text>
            <Text style={{ color: colors.mutedText, fontSize: 12, marginTop: 2 }}>
              Active
            </Text>
          </View>
        </View>

        {/* Quick actions */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <QuickAction
            icon="qr-code-outline"
            label="Scan"
            onPress={handleFabPress}
            colors={colors}
          />
          <QuickAction
            icon="time-outline"
            label="History"
            onPress={() => router.push(TABS.HISTORY)}
            colors={colors}
          />
          <QuickAction
            icon="person-outline"
            label="Profile"
            onPress={() => router.push(TABS.PROFILE)}
            colors={colors}
          />
        </View>

        {error ? (
          <View style={{
            backgroundColor: `${colors.warning}14`, borderRadius: 12,
            paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
          }}>
            <Text style={{ color: colors.warning, fontSize: 12 }}>
              {error} — showing cached data
            </Text>
          </View>
        ) : null}

        {/* Recent Credentials */}
        {uniqueCredentials.length === 0 && !loading ? (
          <EmptyState />
        ) : recentCredentials.length > 0 ? (
          <>
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: 14,
            }}>
              <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600' }}>
                Recent Credentials
              </Text>
              {uniqueCredentials.length > 3 && (
                <Pressable
                  onPress={() => router.push(TABS.CREDENTIALS)}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 4,
                    opacity: pressed ? 0.7 : 1,
                    paddingVertical: 4, paddingHorizontal: 8,
                  })}
                  accessibilityLabel="See all credentials"
                  accessibilityRole="button"
                >
                  <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                    See All
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </Pressable>
              )}
            </View>

            {recentCredentials.map((cred, index) => (
              <View key={cred.id} style={{ marginBottom: index < recentCredentials.length - 1 ? 12 : 0 }}>
                <CredentialCard
                  credential={cred}
                  onPress={() => router.push(TABS.CREDENTIAL(cred.id))}
                />
              </View>
            ))}

            {/* View all button at bottom */}
            {uniqueCredentials.length > 3 && (
              <Pressable
                onPress={() => router.push(TABS.CREDENTIALS)}
                style={({ pressed }) => ({
                  marginTop: 16,
                  paddingVertical: 14,
                  borderRadius: 14,
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: pressed ? 0.9 : 1,
                })}
                accessibilityLabel="View all credentials"
                accessibilityRole="button"
              >
                <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                  View All {uniqueCredentials.length} Credentials
                </Text>
              </Pressable>
            )}
          </>
        ) : null}
      </ScrollView>

      {/* FAB */}
      <View style={{ position: 'absolute', bottom: 32, right: 20 }}>
        <Pressable
          onPress={handleFabPress}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            opacity: pressed ? 0.9 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 28,
            gap: 8,
            ...shadow,
          })}
          accessibilityLabel="Scan QR code to receive or present credential"
          accessibilityRole="button"
          accessibilityHint="Opens the QR scanner camera"
        >
          <Ionicons name="qr-code-outline" size={20} color={colors.primaryFg} />
          <Text style={{ color: colors.primaryFg, fontSize: 15, fontWeight: '700' }}>
            Scan
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: { surface: string; primary: string; foreground: string; border: string };
}

function QuickAction({ icon, label, onPress, colors }: QuickActionProps) {
  return (
    <Pressable
      onPress={() => {
        impactMedium();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: pressed ? 0.85 : 1,
      })}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
