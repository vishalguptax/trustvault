import { View, Text, FlatList } from 'react-native';
import { useCredentialStore } from '@/lib/store';

export default function ConsentHistory() {
  const history = useCredentialStore((state) => state.consentHistory);

  if (history.length === 0) {
    return (
      <View className="flex-1 bg-vault-bg items-center justify-center px-8">
        <Text className="text-vault-muted-text text-center">
          No presentations yet. Your consent history will appear here after you present credentials to a verifier.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-vault-bg"
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View className="bg-vault-surface rounded-xl p-4 mb-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-vault-foreground font-semibold">{item.verifierName}</Text>
            <Text className={`text-xs font-medium ${item.result === 'verified' ? 'text-success' : 'text-danger'}`}>
              {item.result.toUpperCase()}
            </Text>
          </View>
          <Text className="text-vault-muted-text text-xs mb-1">
            Shared: {item.disclosedClaims.join(', ')}
          </Text>
          <Text className="text-vault-muted-text text-xs">
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      )}
    />
  );
}
