import { View, Text } from 'react-native';
import { useTheme } from '@/lib/theme';

interface StatusBadgeProps {
  status: 'active' | 'revoked' | 'suspended' | 'expired';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { colors } = useTheme();

  const STATUS_STYLES = {
    active: { bg: `${colors.success}33`, text: colors.success, label: 'Active' },
    revoked: { bg: `${colors.danger}33`, text: colors.danger, label: 'Revoked' },
    suspended: { bg: `${colors.warning}33`, text: colors.warning, label: 'Suspended' },
    expired: { bg: colors.muted, text: colors.mutedText, label: 'Expired' },
  } as const;

  const style = STATUS_STYLES[status];

  return (
    <View
      style={{ backgroundColor: style.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}
      accessibilityLabel={`Status: ${style.label}`}
      accessibilityRole="text"
      accessibilityHint={`This credential is currently ${style.label.toLowerCase()}`}
    >
      <Text style={{ color: style.text, fontSize: 10, fontWeight: '600' }}>
        {style.label}
      </Text>
    </View>
  );
}
