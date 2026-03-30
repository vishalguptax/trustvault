import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useCredentialStore } from '@/lib/store';
import { StatusBadge } from '@/components/status-badge';
import { ClaimsList } from '@/components/claims-list';
import { IssuerBadge } from '@/components/issuer-badge';

export default function CredentialDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const credential = useCredentialStore((state) =>
    state.credentials.find((c) => c.id === id)
  );

  if (!credential) {
    return (
      <View className="flex-1 bg-vault-bg items-center justify-center">
        <Text className="text-vault-muted-text">Credential not found</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-vault-bg" contentContainerStyle={{ padding: 16 }}>
      <View className="bg-vault-surface rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-vault-foreground text-xl font-bold">
            {credential.typeName}
          </Text>
          <StatusBadge status={credential.status} />
        </View>
        <IssuerBadge issuerDid={credential.issuerDid} issuerName={credential.issuerName} />
        <Text className="text-vault-muted-text text-xs mt-2">
          Issued: {new Date(credential.issuedAt).toLocaleDateString()}
        </Text>
        {credential.expiresAt && (
          <Text className="text-vault-muted-text text-xs">
            Expires: {new Date(credential.expiresAt).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View className="bg-vault-surface rounded-xl p-4">
        <Text className="text-vault-foreground text-lg font-semibold mb-3">Claims</Text>
        <ClaimsList
          claims={credential.claims}
          sdClaims={credential.sdClaims}
        />
      </View>
    </ScrollView>
  );
}
