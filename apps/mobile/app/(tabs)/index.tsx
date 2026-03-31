import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { impactMedium, notifySuccess, notifyError, notifyWarning } from '@/lib/haptics';
import { CredentialCard } from '@/components/credential-card';
import { EmptyState } from '@/components/empty-state';
import { useCredentials } from '@/hooks/use-credentials';
import { useTheme } from '@/lib/theme';

export default function WalletHome() {
  const router = useRouter();
  const { colors } = useTheme();
  const { credentials, loading, error, refresh } = useCredentials();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleFabPress = useCallback(() => {
    impactMedium();
    router.push('/scanner');
  }, [router]);

  const handleCredentialPress = useCallback(
    (id: string) => {
      router.push(`/credential/${id}`);
    },
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header info */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ color: colors.mutedText, fontSize: 13 }}>
          {credentials.length} credential{credentials.length !== 1 ? 's' : ''}{' '}
          stored
        </Text>
        {error ? (
          <Text style={{ color: colors.danger, fontSize: 12, marginTop: 4 }}>
            {error} — showing cached data
          </Text>
        ) : null}
      </View>

      {/* Loading state on first load */}
      {loading && credentials.length === 0 && !error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.mutedText, fontSize: 14, marginTop: 12 }}>
            Loading credentials...
          </Text>
        </View>
      ) : credentials.length === 0 && !loading ? (
        <EmptyState />
      ) : (
        <FlatList
          data={credentials}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CredentialCard
              credential={item}
              onPress={() => handleCredentialPress(item.id)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
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
      )}

      {/* FAB */}
      <View
        style={{
          position: 'absolute',
          bottom: 32,
          right: 24,
        }}
      >
        <Pressable
          onPress={handleFabPress}
          style={({ pressed }) => ({
            backgroundColor: colors.primary,
            opacity: pressed ? 0.85 : 1,
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          })}
          accessibilityLabel="Scan QR code to receive or present credential"
          accessibilityRole="button"
          accessibilityHint="Opens the QR scanner camera"
        >
          <Text style={{ color: colors.primaryFg, fontSize: 28, fontWeight: '700', marginTop: -2 }}>
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
