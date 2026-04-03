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

  const handleScan = useCallback(() => {
    impactMedium();
    router.push(TABS.SCANNER);
  }, [router]);

  const uniqueCredentials = useMemo(() => {
    return credentials.filter(
      (cred, index, self) => self.findIndex((c) => c.id === cred.id) === index,
    );
  }, [credentials]);

  const activeCount = uniqueCredentials.filter((c) => c.status === 'active').length;
  const revokedCount = uniqueCredentials.filter(
    (c) => c.status === 'revoked' || c.status === 'expired',
  ).length;

  const recentCredentials = useMemo(() => {
    return [...uniqueCredentials]
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
      .slice(0, 3);
  }, [uniqueCredentials]);

  if (loading && uniqueCredentials.length === 0 && !error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.mutedText, fontSize: 14, marginTop: 12 }}>
          Loading your wallet...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
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
        {/* ════════════════════════════════════════════
            HERO WALLET CARD
            Inspired by fintech wallet patterns —
            single card with greeting, balance-like stats,
            and quick actions baked in.
            ════════════════════════════════════════════ */}
        <View style={{
          marginHorizontal: 16, marginTop: 12, marginBottom: 20,
          backgroundColor: colors.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
          overflow: 'hidden',
          ...shadow,
        }}>
          {/* Dark header zone */}
          <View style={{
            backgroundColor: colors.muted,
            paddingHorizontal: 20, paddingTop: 22, paddingBottom: 20,
          }}>
            {/* Greeting + date */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <View>
                <Text style={{
                  color: colors.mutedText,
                  fontSize: 13, fontWeight: '500',
                }}>
                  {getGreeting()},
                </Text>
                <Text style={{
                  color: colors.foreground,
                  fontSize: 24, fontWeight: '700', marginTop: 2, letterSpacing: -0.5,
                }}>
                  {firstName}
                </Text>
              </View>
              <Text style={{
                color: colors.mutedText,
                fontSize: 11, marginTop: 4,
              }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </View>

            {/* Stats row inside dark zone */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{
                flex: 1, backgroundColor: colors.surface,
                borderRadius: 14, padding: 14,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <View style={{
                    width: 24, height: 24, borderRadius: 8,
                    backgroundColor: `${colors.primary}30`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="wallet" size={12} color={colors.primary} />
                  </View>
                  <Text style={{
                    color: colors.mutedText,
                    fontSize: 11, fontWeight: '600',
                  }}>
                    Total
                  </Text>
                </View>
                <Text style={{
                  color: colors.foreground,
                  fontSize: 28, fontWeight: '800', letterSpacing: -1,
                }}>
                  {uniqueCredentials.length}
                </Text>
              </View>

              <View style={{ flex: 1, gap: 8 }}>
                {/* Active mini card */}
                <View style={{
                  flex: 1, backgroundColor: colors.surface,
                  borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success }} />
                    <Text style={{
                      color: colors.mutedText,
                      fontSize: 11, fontWeight: '600',
                    }}>
                      Active
                    </Text>
                  </View>
                  <Text style={{
                    color: colors.foreground,
                    fontSize: 18, fontWeight: '700',
                  }}>
                    {activeCount}
                  </Text>
                </View>

                {/* Expired mini card */}
                <View style={{
                  flex: 1, backgroundColor: colors.surface,
                  borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{
                      width: 6, height: 6, borderRadius: 3,
                      backgroundColor: revokedCount > 0 ? colors.danger : colors.mutedText,
                    }} />
                    <Text style={{
                      color: colors.mutedText,
                      fontSize: 11, fontWeight: '600',
                    }}>
                      Expired
                    </Text>
                  </View>
                  <Text style={{
                    color: colors.foreground,
                    fontSize: 18, fontWeight: '700',
                  }}>
                    {revokedCount}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Quick actions row — inside card, light zone */}
          <View style={{
            flexDirection: 'row',
            paddingHorizontal: 12, paddingVertical: 14,
            gap: 4,
          }}>
            <QuickAction icon="qr-code-outline" label="Scan" accent={colors.primary} colors={colors} onPress={handleScan} />
            <QuickAction icon="time-outline" label="History" accent={colors.info} colors={colors} onPress={() => router.push(TABS.HISTORY)} />
            <QuickAction icon="person-outline" label="Profile" accent={colors.mutedText} colors={colors} onPress={() => router.push(TABS.PROFILE)} />
            <QuickAction icon="list-outline" label="All" accent={colors.success} colors={colors} onPress={() => router.push(TABS.CREDENTIALS)} />
          </View>
        </View>

        {/* ════════════════════════════════════════════
            ERROR BANNER
            ════════════════════════════════════════════ */}
        {error ? (
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            marginHorizontal: 16,
            backgroundColor: `${colors.warning}12`, borderRadius: 12,
            borderWidth: 1, borderColor: `${colors.warning}30`,
            paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
          }}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} />
            <Text style={{ color: colors.warning, fontSize: 12, flex: 1 }}>
              {error} — showing cached data
            </Text>
          </View>
        ) : null}

        {/* ════════════════════════════════════════════
            CREDENTIALS SECTION
            ════════════════════════════════════════════ */}
        <View style={{ paddingHorizontal: 16 }}>
          {uniqueCredentials.length === 0 && !loading ? (
            <EmptyState />
          ) : recentCredentials.length > 0 ? (
            <>
              {/* Section header */}
              <View style={{
                flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 14,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    width: 3, height: 16, borderRadius: 2,
                    backgroundColor: colors.primary,
                  }} />
                  <Text style={{
                    color: colors.foreground, fontSize: 17, fontWeight: '700',
                    letterSpacing: -0.3,
                  }}>
                    Recent Credentials
                  </Text>
                </View>
                {uniqueCredentials.length > 3 && (
                  <Pressable
                    onPress={() => router.push(TABS.CREDENTIALS)}
                    hitSlop={8}
                    style={({ pressed }) => ({
                      flexDirection: 'row', alignItems: 'center', gap: 2,
                      opacity: pressed ? 0.7 : 1,
                      paddingVertical: 4, paddingHorizontal: 4,
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

              {/* Credential cards */}
              <View style={{ gap: 12 }}>
                {recentCredentials.map((cred) => (
                  <CredentialCard
                    key={cred.id}
                    credential={cred}
                    onPress={() => router.push(TABS.CREDENTIAL(cred.id))}
                  />
                ))}
              </View>

              {/* View all CTA */}
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
                    flexDirection: 'row',
                    justifyContent: 'center',
                    gap: 6,
                    opacity: pressed ? 0.9 : 1,
                  })}
                  accessibilityLabel="View all credentials"
                  accessibilityRole="button"
                >
                  <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>
                    View All {uniqueCredentials.length} Credentials
                  </Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.primary} />
                </Pressable>
              )}
            </>
          ) : null}
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <View style={{ position: 'absolute', bottom: 32, right: 20 }}>
        <Pressable
          onPress={handleScan}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            opacity: pressed ? 0.9 : 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 22,
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

/* ── Quick Action (compact, inside hero card) ── */

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  colors: { foreground: string; muted: string };
  accent: string;
}

function QuickAction({ icon, label, onPress, colors, accent }: QuickActionProps) {
  return (
    <Pressable
      onPress={() => { impactMedium(); onPress(); }}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: pressed ? colors.muted : 'transparent',
        opacity: pressed ? 0.85 : 1,
        gap: 6,
      })}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      <View style={{
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: `${accent}14`,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={icon} size={19} color={accent} />
      </View>
      <Text style={{ color: colors.foreground, fontSize: 11, fontWeight: '600' }}>
        {label}
      </Text>
    </Pressable>
  );
}
