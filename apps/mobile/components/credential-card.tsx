import { View, Text, Pressable } from 'react-native';
import { memo } from 'react';
import type { StoredCredential } from '@/lib/store';
import { CREDENTIAL_TYPE_CONFIG } from '@/lib/constants';
import { StatusBadge } from './status-badge';
import { useTheme } from '@/lib/theme';

interface CredentialCardProps {
  credential: StoredCredential;
  onPress: () => void;
}

export const CredentialCard = memo(function CredentialCard({
  credential,
  onPress,
}: CredentialCardProps) {
  const { colors } = useTheme();
  const config =
    CREDENTIAL_TYPE_CONFIG[credential.type as keyof typeof CREDENTIAL_TYPE_CONFIG];
  const accentColor = config?.accent ?? colors.primary;

  const previewClaims = Object.entries(credential.claims).slice(0, 3);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.9 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
      accessibilityLabel={`${credential.typeName} credential from ${credential.issuerName}, status ${credential.status}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view credential details"
    >
      <View style={{
        flexDirection: 'row',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <View style={{ width: 4, backgroundColor: accentColor }} />
        <View style={{ flex: 1, backgroundColor: colors.surface, padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 16 }} numberOfLines={1}>
              {credential.typeName}
            </Text>
            <StatusBadge status={credential.status} />
          </View>
          <Text style={{ color: colors.mutedText, fontSize: 12, marginBottom: 12 }} numberOfLines={1}>
            {credential.issuerName}
          </Text>
          {previewClaims.map(([key, value]) => (
            <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: colors.mutedText, fontSize: 12, textTransform: 'capitalize' }}>{key}</Text>
              <Text style={{ color: colors.foreground, fontSize: 12 }}>{String(value)}</Text>
            </View>
          ))}
          <Text style={{ color: colors.mutedText, fontSize: 10, marginTop: 8 }}>
            Issued {new Date(credential.issuedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
