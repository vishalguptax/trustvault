import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

interface ClaimsListProps {
  claims: Record<string, unknown>;
  sdClaims: string[];
}

export function ClaimsList({ claims, sdClaims }: ClaimsListProps) {
  const { colors } = useTheme();

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
              borderBottomColor: colors.muted,
            }}
            accessibilityLabel={`${key}: ${String(value)}, ${disclosureLabel}`}
            accessibilityRole="text"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Text
                style={{ fontSize: 12, marginRight: 8 }}
                accessibilityLabel={disclosureLabel}
              >
{isSelectivelyDisclosable ? <Ionicons name="lock-open-outline" size={14} color={colors.primary} /> : <Ionicons name="lock-closed-outline" size={14} color={colors.mutedText} />}
              </Text>
              <Text style={{ color: colors.mutedText, fontSize: 14, textTransform: 'capitalize' }}>{key}</Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 14, flex: 1, textAlign: 'right' }}>
              {String(value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
