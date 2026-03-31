import { View, Text } from 'react-native';

interface StatusBadgeProps {
  status: 'active' | 'revoked' | 'suspended' | 'expired';
}

const STATUS_STYLES = {
  active: { bg: 'rgba(16,185,129,0.2)', text: '#10B981', label: 'Active' },
  revoked: { bg: 'rgba(239,68,68,0.2)', text: '#EF4444', label: 'Revoked' },
  suspended: { bg: 'rgba(245,158,11,0.2)', text: '#F59E0B', label: 'Suspended' },
  expired: { bg: '#1F2937', text: '#6B7280', label: 'Expired' },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
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
