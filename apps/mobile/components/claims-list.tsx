import { View, Text } from 'react-native';

interface ClaimsListProps {
  claims: Record<string, unknown>;
  sdClaims: string[];
}

export function ClaimsList({ claims, sdClaims }: ClaimsListProps) {
  return (
    <View accessibilityRole="list">
      {Object.entries(claims).map(([key, value]) => {
        const isSelectivelyDisclosable = sdClaims.includes(key);
        const disclosureLabel = isSelectivelyDisclosable
          ? 'selectively disclosable'
          : 'always disclosed';

        return (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: '#1F2937',
            }}
            accessibilityLabel={`${key}: ${String(value)}, ${disclosureLabel}`}
            accessibilityRole="text"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text
                style={{ fontSize: 12, marginRight: 8 }}
                accessibilityLabel={disclosureLabel}
              >
                {isSelectivelyDisclosable ? '🔓' : '🔒'}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 14, textTransform: 'capitalize' }}>{key}</Text>
            </View>
            <Text style={{ color: '#F9FAFB', fontSize: 14, flex: 1, textAlign: 'right' }}>
              {String(value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
