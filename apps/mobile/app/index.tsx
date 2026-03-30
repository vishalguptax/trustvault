import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useCredentialStore } from '@/lib/store';
import { CredentialCard } from '@/components/credential-card';
import { EmptyState } from '@/components/empty-state';

export default function WalletHome() {
  const router = useRouter();
  const credentials = useCredentialStore((state) => state.credentials);

  return (
    <View className="flex-1 bg-vault-bg">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-vault-muted-text text-sm">
          {credentials.length} credential{credentials.length !== 1 ? 's' : ''} stored
        </Text>
      </View>

      {credentials.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={credentials}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CredentialCard
              credential={item}
              onPress={() => router.push(`/credential/${item.id}`)}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View className="absolute bottom-8 right-6">
        <Pressable
          onPress={() => router.push('/scanner')}
          className="bg-primary w-14 h-14 rounded-full items-center justify-center shadow-lg active:scale-95"
        >
          <Text className="text-vault-bg text-2xl font-bold">+</Text>
        </Pressable>
      </View>
    </View>
  );
}
