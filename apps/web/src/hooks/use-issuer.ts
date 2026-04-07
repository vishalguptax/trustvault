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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issuerApi.createOffer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuer', 'offers'] });
    },
  });
}

export function useCreateBulkOffers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: issuerApi.createBulkOffers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuer', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['issuer', 'credentials'] });
    },
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
