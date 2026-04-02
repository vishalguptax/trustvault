import { View, Text } from 'react-native';
import { useTheme } from '@/lib/theme';

interface StatusBadgeProps {
  status: 'active' | 'revoked' | 'suspended' | 'expired';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors } = useTheme();

  const STATUS_STYLES = {
    active: { bg: `${colors.success}1A`, text: colors.success, dot: colors.success, label: 'Active' },
    revoked: { bg: `${colors.danger}1A`, text: colors.danger, dot: colors.danger, label: 'Revoked' },
    suspended: { bg: `${colors.warning}1A`, text: colors.warning, dot: colors.warning, label: 'Suspended' },
    expired: { bg: colors.muted, text: colors.mutedText, dot: colors.mutedText, label: 'Expired' },
  } as const;

  const style = STATUS_STYLES[status];

  return (
    <View
      style={{
        backgroundColor: style.bg,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
      }}
      accessibilityLabel={`Status: ${style.label}`}
      accessibilityRole="text"
      accessibilityHint={`This credential is currently ${style.label.toLowerCase()}`}
    >
      <View style={{
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: style.dot,
      }} />
      <Text style={{ color: style.text, fontSize: 11, fontWeight: '600' }}>
        {style.label}
      </Text>
    </View>
  );
}
