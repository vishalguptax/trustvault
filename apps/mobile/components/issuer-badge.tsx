import { View, Text } from 'react-native';
import { useTheme } from '@/lib/theme';

interface IssuerBadgeProps {
  issuerDid: string;
  issuerName: string;
}

export function IssuerBadge({ issuerDid, issuerName }: IssuerBadgeProps) {
  const { colors } = useTheme();

  const truncatedDid =
    issuerDid.length > 24
      ? `${issuerDid.slice(0, 20)}...${issuerDid.slice(-4)}`
      : issuerDid;

  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'center' }}
      accessibilityLabel={`Issued by ${issuerName}`}
      accessibilityRole="text"
      accessibilityHint={`Issuer DID: ${truncatedDid}`}
    >
      <View style={{
        width: 24,
        height: 24,
        backgroundColor: `${colors.primary}33`,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
      }}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }} accessibilityElementsHidden>
          {issuerName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View>
        <Text style={{ color: colors.foreground, fontSize: 14, fontWeight: '500' }}>{issuerName}</Text>
        <Text style={{ color: colors.mutedText, fontSize: 10, fontFamily: 'monospace' }}>{truncatedDid}</Text>
      </View>
    </View>
  );
}
