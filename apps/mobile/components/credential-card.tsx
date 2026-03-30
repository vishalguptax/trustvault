import { View, Text, Pressable } from 'react-native';
import { memo } from 'react';
import type { StoredCredential } from '@/lib/store';
import { CREDENTIAL_TYPE_CONFIG } from '@/lib/constants';
import { StatusBadge } from './status-badge';

interface CredentialCardProps {
  credential: StoredCredential;
  onPress: () => void;
}

export const CredentialCard = memo(function CredentialCard({
  credential,
  onPress,
}: CredentialCardProps) {
  const config = CREDENTIAL_TYPE_CONFIG[credential.type as keyof typeof CREDENTIAL_TYPE_CONFIG];
  const accentColor = config?.accent ?? '#14B8A6';

  const previewClaims = Object.entries(credential.claims).slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      className="active:scale-[0.98]"
      style={{ transform: [{ scale: 1 }] }}
    >
      <View
        style={{ borderLeftColor: accentColor, borderLeftWidth: 4 }}
        className="bg-vault-surface rounded-xl p-4"
      >
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-vault-foreground font-semibold text-base">
            {credential.typeName}
          </Text>
          <StatusBadge status={credential.status} />
        </View>

        <Text className="text-vault-muted-text text-xs mb-3">
          {credential.issuerName}
        </Text>

        {previewClaims.map(([key, value]) => (
          <View key={key} className="flex-row justify-between mb-1">
            <Text className="text-vault-muted-text text-xs capitalize">{key}</Text>
            <Text className="text-vault-foreground text-xs">{String(value)}</Text>
          </View>
        ))}

        <Text className="text-vault-muted-text text-[10px] mt-2">
          Issued {new Date(credential.issuedAt).toLocaleDateString()}
        </Text>
      </View>
    </Pressable>
  );
});
