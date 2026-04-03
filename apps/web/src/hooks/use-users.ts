import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';

export function useUsers() {
  return useQuery({
    queryKey: ['auth', 'users'],
    queryFn: authApi.listUsers,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; role?: string; active?: boolean } }) =>
      authApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'users'] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'users'] });
    },
  });
}
