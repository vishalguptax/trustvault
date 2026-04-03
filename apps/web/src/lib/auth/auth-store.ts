import { create } from 'zustand';
import { setAuthHelpers } from '@/lib/api/client';
import { API_BASE_URL } from '@/lib/constants';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'issuer' | 'verifier' | 'holder';
  active: boolean;
  trustedIssuerId: string | null;
  createdAt: string;
}

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string, role: string) => Promise<User>;
  logout: () => Promise<void>;
  getAccessToken: () => string | null;
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  return (json && typeof json === 'object' && 'data' in json ? json.data : json) as T;
}

export const ROLE_REDIRECTS: Record<string, string> = {
  admin: '/admin',
  issuer: '/issuer',
  verifier: '/verifier',
  holder: '/',
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  getAccessToken: () => get().accessToken,

  init: async () => {
    const storedRefresh = localStorage.getItem('trustilock-refresh-token');
    if (!storedRefresh) {
      set({ isLoading: false });
      return;
    }

    try {
      const tokens = await authFetch<AuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: storedRefresh }),
      });
      const user = await authFetch<User>('/auth/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      localStorage.setItem('trustilock-refresh-token', tokens.refresh_token);
      set({
        user,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem('trustilock-refresh-token');
      set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const data = await authFetch<{ access_token: string; refresh_token: string; user: User }>(
      '/auth/login',
      { method: 'POST', body: JSON.stringify({ email, password }) },
    );
    localStorage.setItem('trustilock-refresh-token', data.refresh_token);
    set({
      user: data.user,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isAuthenticated: true,
    });
    return data.user;
  },

  register: async (email, password, name, role) => {
    const data = await authFetch<{ access_token: string; refresh_token: string; user: User }>(
      '/auth/register',
      { method: 'POST', body: JSON.stringify({ email, password, name, role }) },
    );
    localStorage.setItem('trustilock-refresh-token', data.refresh_token);
    set({
      user: data.user,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isAuthenticated: true,
    });
    return data.user;
  },

  logout: async () => {
    const { accessToken } = get();
    if (accessToken) {
      try {
        await authFetch('/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}` },
        });
      } catch {
        // Logout locally even if API call fails
      }
    }
    localStorage.removeItem('trustilock-refresh-token');
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));

// Wire the store into the API client so all requests get auth headers + auto-refresh
setAuthHelpers(
  () => useAuthStore.getState().accessToken,
  async () => {
    // Attempt to refresh the access token when a 401 is received
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) return false;
    try {
      const tokens = await authFetch<AuthTokens>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      localStorage.setItem('trustilock-refresh-token', tokens.refresh_token);
      useAuthStore.setState({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
      });
      return true;
    } catch {
      return false;
    }
  },
  () => {
    // Final fallback: clear auth and redirect to login
    localStorage.removeItem('trustilock-refresh-token');
    useAuthStore.setState({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
);
