import { View, Text } from 'react-native';

interface ClaimsListProps {
  claims: Record<string, unknown>;
  sdClaims: string[];
}

export function ClaimsList({ claims, sdClaims }: ClaimsListProps) {
  return (
    <View>
      {Object.entries(claims).map(([key, value]) => {
        const isSelectivelyDisclosable = sdClaims.includes(key);

        return (
          <View
            key={key}
            className="flex-row items-center justify-between py-2 border-b border-vault-muted"
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-xs mr-2">
                {isSelectivelyDisclosable ? '🔓' : '🔒'}
              </Text>
              <Text className="text-vault-muted-text text-sm capitalize">{key}</Text>
            </View>
            <Text className="text-vault-foreground text-sm flex-1 text-right">
              {String(value)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
