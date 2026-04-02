import { View, Text } from 'react-native';
import { useTheme } from '@/lib/theme';
import { truncateDid, didDisplayName } from '@/lib/format';

interface IssuerBadgeProps {
  issuerDid: string;
  issuerName: string;
}

export function IssuerBadge({ issuerDid, issuerName }: IssuerBadgeProps) {
  const { colors } = useTheme();

  // Use issuerName if it is a real name (not a DID), otherwise derive from DID
  const displayName = issuerName && !issuerName.startsWith('did:')
    ? issuerName
    : didDisplayName(issuerDid);

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      accessibilityLabel={`Issued by ${displayName}`}
      accessibilityRole="text"
    >
      <View style={{
        width: 24, height: 24,
        backgroundColor: `${colors.primary}18`,
        borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 8,
      }}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }} accessibilityElementsHidden>
          {initial}
        </Text>
      </View>
      <View>
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>{displayName}</Text>
        {issuerDid ? (
          <Text style={{ color: colors.mutedText, fontSize: 10, fontFamily: 'monospace' }}>
            {truncateDid(issuerDid)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
