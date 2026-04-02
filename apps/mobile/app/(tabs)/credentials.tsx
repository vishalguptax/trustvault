import { View, Text, TextInput, SectionList, ScrollView, Pressable, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { CredentialCard } from '@/components/credential-card';
import { useCredentials } from '@/hooks/use-credentials';
import type { StoredCredential } from '@/lib/store';
import { useTheme, cardShadow, cardShadowDark } from '@/lib/theme';
import { TABS } from '@/lib/routes';
import { CREDENTIAL_CATEGORIES, CREDENTIAL_TYPE_CONFIG, formatCredentialType } from '@/lib/constants';

type StatusFilter = 'all' | 'active' | 'revoked' | 'expired';

interface CredentialSection {
  title: string;
  accent: string;
  icon: string;
  data: StoredCredential[];
  count: number;
}

export default function CredentialsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { credentials, loading, refresh } = useCredentials();
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const shadow = isDark ? cardShadowDark : cardShadow;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  // Deduplicate and filter
  const filtered = useMemo(() => {
    const deduped = credentials.filter(
      (cred, index, self) => self.findIndex((c) => c.id === cred.id) === index,
    );
    const query = search.toLowerCase().trim();
    return deduped.filter((cred) => {
      if (statusFilter !== 'all' && cred.status !== statusFilter) return false;
      if (!query) return true;
      const typeName = formatCredentialType(cred.type) || cred.typeName;
      return (
        typeName.toLowerCase().includes(query) ||
        (cred.issuerName ?? '').toLowerCase().includes(query) ||
        Object.values(cred.claims).some((v) => String(v).toLowerCase().includes(query))
      );
    });
  }, [credentials, search, statusFilter]);

  // Group into sections by category
  const sections: CredentialSection[] = useMemo(() => {
    return CREDENTIAL_CATEGORIES
      .map((cat) => {
        const items = filtered.filter((c) => c.type === cat.type);
        return {
          title: cat.label,
          accent: cat.accent,
          icon: cat.icon,
          data: collapsedSections[cat.type] ? [] : items,
          count: items.length,
          type: cat.type,
        };
      })
      .filter((s) => s.count > 0);
  }, [filtered, collapsedSections]);

  const toggleSection = useCallback((type: string) => {
    setCollapsedSections((prev) => ({ ...prev, [type]: !prev[type] }));
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
            {/* Search */}
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: colors.surface, borderRadius: 14,
              borderWidth: 1, borderColor: colors.border,
              paddingHorizontal: 14, marginBottom: 12,
            }}>
              <Ionicons name="search-outline" size={18} color={colors.mutedText} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search credentials..."
                placeholderTextColor={colors.placeholder}
                style={{
                  flex: 1, color: colors.foreground, fontSize: 15,
                  paddingVertical: 12, paddingHorizontal: 10,
                }}
                accessibilityLabel="Search credentials"
                returnKeyType="search"
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
                  <Ionicons name="close-circle" size={18} color={colors.mutedText} />
                </Pressable>
              )}
            </View>

            {/* Status filter */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4, paddingRight: 8 }}
              style={{ marginBottom: 16 }}
            >
              {(['all', 'active', 'revoked', 'expired'] as const).map((filter) => {
                const isActive = statusFilter === filter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setStatusFilter(filter)}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 7,
                      borderRadius: 20,
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderWidth: isActive ? 0 : 1,
                      borderColor: colors.border,
                    }}
                    accessibilityLabel={`Status: ${filter}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={{
                      color: isActive ? colors.primaryFg : colors.mutedText,
                      fontSize: 13, fontWeight: '600',
                      textTransform: 'capitalize',
                    }}>
                      {filter}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Result count */}
            <Text style={{ color: colors.mutedText, fontSize: 12, marginBottom: 8 }}>
              {filtered.length} credential{filtered.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const cat = CREDENTIAL_CATEGORIES.find((c) => c.label === section.title);
          const isCollapsed = cat ? collapsedSections[cat.type] ?? false : false;

          return (
            <Pressable
              onPress={() => cat && toggleSection(cat.type)}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 20, paddingVertical: 12,
                backgroundColor: colors.bg,
              }}
              accessibilityLabel={`${section.title} — ${section.count} credentials. ${isCollapsed ? 'Tap to expand' : 'Tap to collapse'}`}
              accessibilityRole="button"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 8, height: 8, borderRadius: 4,
                  backgroundColor: section.accent,
                }} />
                <Text style={{ color: colors.foreground, fontSize: 15, fontWeight: '600' }}>
                  {section.title}
                </Text>
                <View style={{
                  backgroundColor: `${section.accent}20`,
                  paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10,
                }}>
                  <Text style={{ color: section.accent, fontSize: 11, fontWeight: '700' }}>
                    {section.count}
                  </Text>
                </View>
              </View>
              <Ionicons
                name={isCollapsed ? 'chevron-forward' : 'chevron-down'}
                size={16}
                color={colors.mutedText}
              />
            </Pressable>
          );
        }}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
            <CredentialCard
              credential={item}
              onPress={() => router.push(TABS.CREDENTIAL(item.id))}
            />
          </View>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 32 }}>
            <Ionicons name="folder-open-outline" size={40} color={colors.mutedText} />
            <Text style={{ color: colors.foreground, fontSize: 16, fontWeight: '600', marginTop: 12 }}>
              No credentials found
            </Text>
            <Text style={{ color: colors.mutedText, fontSize: 14, textAlign: 'center', marginTop: 4 }}>
              {search || statusFilter !== 'all'
                ? 'Try adjusting your search or filters.'
                : 'Scan a QR code to receive your first credential.'}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 40 }}
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
      />
    </View>
  );
}
