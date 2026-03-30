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
    <View className="flex-row items-center">
      <View className="w-6 h-6 bg-primary/20 rounded-full items-center justify-center mr-2">
        <Text className="text-primary text-xs font-bold">
          {issuerName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View>
        <Text className="text-vault-foreground text-sm font-medium">{issuerName}</Text>
        <Text className="text-vault-muted-text text-[10px] font-mono">{truncatedDid}</Text>
      </View>
    </View>
  );
}
