import { View, Text, FlatList } from 'react-native';
import { useCredentialStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';

export default function ConsentHistory() {
  const { colors } = useTheme();
  const history = useCredentialStore((state) => state.consentHistory);

  if (history.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <Text style={{ color: colors.mutedText, textAlign: 'center' }}>
          No presentations yet. Your consent history will appear here after you present credentials to a verifier.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
          }}
          accessibilityLabel={`Presentation to ${item.verifierName}, result: ${item.result}, shared: ${item.disclosedClaims.join(', ')}`}
          accessibilityRole="summary"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600' }}>{item.verifierName}</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: item.result === 'verified' ? colors.success : colors.danger,
              }}
              accessibilityLabel={`Result: ${item.result}`}
              accessibilityHint={item.result === 'verified' ? 'Credentials were successfully verified' : 'Credentials were rejected'}
            >
              {item.result.toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: colors.mutedText, fontSize: 12, marginBottom: 4 }}>
            Shared: {item.disclosedClaims.join(', ')}
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 12 }}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      )}
    />
  );
}
