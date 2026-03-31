import { View, Text } from 'react-native';

interface IssuerBadgeProps {
  issuerDid: string;
  issuerName: string;
}

export function IssuerBadge({ issuerDid, issuerName }: IssuerBadgeProps) {
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
        backgroundColor: 'rgba(20,184,166,0.2)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 8,
      }}>
        <Text style={{ color: '#14B8A6', fontSize: 12, fontWeight: '700' }} accessibilityElementsHidden>
          {issuerName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View>
        <Text style={{ color: '#F9FAFB', fontSize: 14, fontWeight: '500' }}>{issuerName}</Text>
        <Text style={{ color: '#6B7280', fontSize: 10, fontFamily: 'monospace' }}>{truncatedDid}</Text>
      </View>
    </View>
  );
}
