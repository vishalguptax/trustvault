import { View, Text } from 'react-native';

interface StatusBadgeProps {
  status: 'active' | 'revoked' | 'suspended' | 'expired';
}

const STATUS_STYLES = {
  active: { bg: 'bg-success/20', text: 'text-success', label: 'Active' },
  revoked: { bg: 'bg-danger/20', text: 'text-danger', label: 'Revoked' },
  suspended: { bg: 'bg-warning/20', text: 'text-warning', label: 'Suspended' },
  expired: { bg: 'bg-vault-muted', text: 'text-vault-muted-text', label: 'Expired' },
} as const;

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];

  return (
    <View className={`${style.bg} px-2 py-0.5 rounded-full`}>
      <Text className={`${style.text} text-[10px] font-semibold`}>
        {style.label}
      </Text>
    </View>
  );
}
