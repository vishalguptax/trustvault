import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { verifierApi } from '@/lib/api/verifier';

export function usePresentations() {
  return useQuery({
    queryKey: ['verifier', 'presentations'],
    queryFn: verifierApi.listPresentations,
  });
}

export function usePresentation(id: string) {
  return useQuery({
    queryKey: ['verifier', 'presentations', id],
    queryFn: () => verifierApi.getPresentation(id),
    enabled: !!id,
  });
}

export function useCreatePresentationRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: verifierApi.createPresentationRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifier', 'presentations'] });
    },
  });
}

export function usePolicies() {
  return useQuery({
    queryKey: ['verifier', 'policies'],
    queryFn: verifierApi.listPolicies,
  });
}

export function useTogglePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      verifierApi.togglePolicy(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verifier', 'policies'] });
    },
  });
}
