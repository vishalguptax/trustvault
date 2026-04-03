import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trustApi } from '@/lib/api/trust';

export function useTrustedIssuers() {
  return useQuery({
    queryKey: ['trust', 'issuers'],
    queryFn: trustApi.listIssuers,
  });
}

export function useTrustSchemas() {
  return useQuery({
    queryKey: ['trust', 'schemas'],
    queryFn: trustApi.listSchemas,
  });
}

export function useRegisterIssuer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trustApi.registerIssuer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust', 'issuers'] });
    },
  });
}

export function useRemoveIssuer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trustApi.removeIssuer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trust', 'issuers'] });
    },
  });
}

export function useOnboardUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: trustApi.onboardUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['trust', 'issuers'] });
    },
  });
}
