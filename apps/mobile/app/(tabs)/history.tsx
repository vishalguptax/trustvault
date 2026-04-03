import { View, Text, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCredentialStore } from '@/lib/store';
import { useTheme } from '@/lib/theme';
import { formatDateTime } from '@/lib/format';

export default function ConsentHistory() {
  const { colors } = useTheme();
  const history = useCredentialStore((state) => state.consentHistory);

  if (history.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
        <View style={{
          width: 96, height: 96, borderRadius: 48,
          backgroundColor: `${colors.primary}14`,
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
        }}>
          <Ionicons name="time-outline" size={40} color={colors.primary} />
        </View>
        <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
          No Presentations Yet
        </Text>
        <Text style={{ color: colors.mutedText, fontSize: 14, textAlign: 'center', lineHeight: 20 }}>
          Your consent history will appear here after you present credentials to a verifier.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1 }}
      data={history}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 20 }}
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            marginBottom: 14,
          }}
          accessibilityLabel={`Presentation to ${item.verifierName}, result: ${item.result}, shared: ${item.disclosedClaims.join(', ')}`}
          accessibilityRole="summary"
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }}>{item.verifierName}</Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: item.result === 'verified' ? `${colors.success}1A` : `${colors.danger}1A`,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 999,
            }}>
              <View style={{
                width: 5, height: 5, borderRadius: 2.5,
                backgroundColor: item.result === 'verified' ? colors.success : colors.danger,
              }} />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: item.result === 'verified' ? colors.success : colors.danger,
                }}
                accessibilityLabel={`Result: ${item.result}`}
              >
                {item.result.toUpperCase()}
              </Text>
            </View>
          </View>
          <Text style={{ color: colors.mutedText, fontSize: 13, marginBottom: 4 }}>
            Shared: {item.disclosedClaims.join(', ')}
          </Text>
          <Text style={{ color: colors.mutedText, fontSize: 12 }}>
            {formatDateTime(item.timestamp)}
          </Text>
        </View>
      )}
    />
  );
}
