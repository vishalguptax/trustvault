import { View, Text, FlatList } from 'react-native';
import { useCredentialStore } from '@/lib/store';

export default function ConsentHistory() {
  const history = useCredentialStore((state) => state.consentHistory);

  if (history.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0B1120', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ color: '#6B7280', textAlign: 'center' }}>
          No presentations yet. Your consent history will appear here after you present credentials to a verifier.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: '#0B1120' }}
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: '#111827',
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
          accessibilityLabel={`Presentation to ${item.verifierName}, result: ${item.result}, shared: ${item.disclosedClaims.join(', ')}`}
          accessibilityRole="summary"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#F9FAFB', fontWeight: '600' }}>{item.verifierName}</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: item.result === 'verified' ? '#10B981' : '#EF4444',
              }}
              accessibilityLabel={`Result: ${item.result}`}
              accessibilityHint={item.result === 'verified' ? 'Credentials were successfully verified' : 'Credentials were rejected'}
            >
              {item.result.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>
            Shared: {item.disclosedClaims.join(', ')}
          </Text>
          <Text style={{ color: '#6B7280', fontSize: 12 }}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      )}
    />
  );
}
