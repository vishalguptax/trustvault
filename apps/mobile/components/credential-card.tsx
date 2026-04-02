import { View, Text, Pressable } from 'react-native';
import { memo } from 'react';
import type { StoredCredential } from '@/lib/store';
import { CREDENTIAL_TYPE_CONFIG, getClaimLabel, formatCredentialType, getDocumentTitle } from '@/lib/constants';
import { filterUserClaims, formatClaimValue, formatDate, didDisplayName } from '@/lib/format';
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

  const documentTitle = getDocumentTitle(credential.type, credential.claims);
  const categoryName = formatCredentialType(credential.type) || credential.typeName;
  const userClaims = filterUserClaims(credential.claims);
  const previewClaims = Object.entries(userClaims).slice(0, 3);
  const issuerLabel = credential.issuerName && !credential.issuerName.startsWith('did:')
    ? credential.issuerName
    : didDisplayName(credential.issuerDid);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.95 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
      accessibilityLabel={`${credential.typeName} credential from ${issuerLabel}, status ${credential.status}`}
      accessibilityRole="button"
      accessibilityHint="Double tap to view credential details"
    >
      <View style={{
        backgroundColor: colors.surface,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 18,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: accentColor, marginRight: 10,
            }} />
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 15 }} numberOfLines={1}>
              {documentTitle}
            </Text>
          </View>
          <StatusBadge status={credential.status} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginLeft: 18, gap: 8 }}>
          <Text style={{ color: accentColor, fontSize: 11, fontWeight: '600' }}>{categoryName}</Text>
          <Text style={{ color: colors.border, fontSize: 11 }}>·</Text>
          <Text style={{ color: colors.mutedText, fontSize: 11 }} numberOfLines={1}>{issuerLabel}</Text>
        </View>
        {previewClaims.map(([key, value]) => (
          <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, paddingHorizontal: 4 }}>
            <Text style={{ color: colors.mutedText, fontSize: 13 }}>{getClaimLabel(key)}</Text>
            <Text style={{ color: colors.foreground, fontSize: 13, fontWeight: '500', flex: 1, textAlign: 'right', marginLeft: 12 }} numberOfLines={1}>
              {formatClaimValue(value)}
            </Text>
          </View>
        ))}
        <Text style={{ color: colors.mutedText, fontSize: 11, marginTop: 10, paddingHorizontal: 4 }}>
          Issued {formatDate(credential.issuedAt)}
        </Text>
      </View>
    </Pressable>
  );
});
