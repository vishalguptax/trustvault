import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuerApi } from '@/lib/api/issuer';

export function useOffers() {
  return useQuery({
    queryKey: ['issuer', 'offers'],
    queryFn: issuerApi.listOffers,
  });
}

export function useCredentials() {
  return useQuery({
    queryKey: ['issuer', 'credentials'],
    queryFn: issuerApi.listCredentials,
  });
}

export function useSchemas() {
  return useQuery({
    queryKey: ['issuer', 'schemas'],
    queryFn: issuerApi.listSchemas,
  });
}

export function useIssuerAuthorization() {
  return useQuery({
    queryKey: ['issuer', 'authorization'],
    queryFn: issuerApi.getAuthorization,
    retry: false,
  });
}

export function useCreateOffer() {
  return useMutation({
    mutationFn: issuerApi.createOffer,
  });
}

export function useRevokeCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ credentialId, reason }: { credentialId: string; reason: string }) =>
      issuerApi.revokeCredential(credentialId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuer', 'credentials'] });
    },
  });
}
