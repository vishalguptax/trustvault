import { View, Text, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { CredentialCard } from '@/components/credential-card';
import { EmptyState } from '@/components/empty-state';
import { useCredentials } from '@/hooks/use-credentials';

export default function WalletHome() {
  const router = useRouter();
  const { credentials, loading, error, refresh } = useCredentials();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleFabPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/scanner');
  }, [router]);

  const handleCredentialPress = useCallback(
    (id: string) => {
      router.push(`/credential/${id}`);
    },
    [router],
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0B1120' }}>
      {/* Header info */}
      <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ color: '#6B7280', fontSize: 13 }}>
          {credentials.length} credential{credentials.length !== 1 ? 's' : ''}{' '}
          stored
        </Text>
        {error ? (
          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>
            {error} — showing cached data
          </Text>
        ) : null}
      </View>

      {/* Loading state on first load */}
      {loading && credentials.length === 0 && !error ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text style={{ color: '#6B7280', fontSize: 14, marginTop: 12 }}>
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
              tintColor="#14B8A6"
              colors={['#14B8A6']}
              progressBackgroundColor="#111827"
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
            backgroundColor: pressed ? '#0D9488' : '#14B8A6',
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#14B8A6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          })}
          accessibilityLabel="Scan QR code to receive or present credential"
          accessibilityRole="button"
        >
          <Text style={{ color: '#0B1120', fontSize: 28, fontWeight: '700', marginTop: -2 }}>
            +
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
