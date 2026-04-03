import { api } from './client';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  trustedIssuerId?: string | null;
  createdAt: string;
}

export const authApi = {
  listUsers: () => api.get<User[]>('/auth/users'),

  updateUser: (id: string, data: { name?: string; role?: string; active?: boolean }) =>
    api.put<User>(`/auth/users/${id}`, data),

  deleteUser: (id: string) => api.delete<{ deleted: boolean }>(`/auth/users/${id}`),
};
