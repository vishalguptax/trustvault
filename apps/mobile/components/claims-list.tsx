import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';
import { getClaimLabel } from '@/lib/constants';
import { filterUserClaims, formatClaimValue } from '@/lib/format';

interface ClaimsListProps {
  claims: Record<string, unknown>;
  sdClaims: string[];
}

export function ClaimsList({ claims, sdClaims }: ClaimsListProps) {
  const { colors } = useTheme();
  const userClaims = filterUserClaims(claims);
  const entries = Object.entries(userClaims);

  if (entries.length === 0) {
    return (
      <Text style={{ color: colors.mutedText, fontSize: 14, textAlign: 'center', paddingVertical: 12 }}>
        No claims available
      </Text>
    );
  }

  return (
    <View accessibilityRole="list" style={{ borderRadius: 12, overflow: 'hidden' }}>
      {entries.map(([key, value], index) => {
        const isSelectivelyDisclosable = sdClaims.includes(key);
        const disclosureLabel = isSelectivelyDisclosable
          ? 'selectively disclosable'
          : 'always disclosed';
        const isEven = index % 2 === 0;

        return (
          <View
            key={key}
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              paddingVertical: 10,
              paddingHorizontal: 12,
              backgroundColor: isEven ? 'transparent' : `${colors.muted}80`,
            }}
            accessibilityLabel={`${getClaimLabel(key)}: ${formatClaimValue(value)}, ${disclosureLabel}`}
            accessibilityRole="text"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ marginRight: 10, marginTop: 2 }} accessibilityLabel={disclosureLabel}>
                {isSelectivelyDisclosable ? (
                  <Ionicons name="lock-open-outline" size={14} color={colors.primary} />
                ) : (
                  <Ionicons name="lock-closed-outline" size={14} color={colors.mutedText} />
                )}
              </View>
              <Text style={{ color: colors.mutedText, fontSize: 14 }}>{getClaimLabel(key)}</Text>
            </View>
            <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 12 }} numberOfLines={2}>
              {formatClaimValue(value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
