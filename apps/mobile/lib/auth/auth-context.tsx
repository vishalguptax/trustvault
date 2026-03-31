import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { API_BASE_URL } from '../constants';
import { getRefreshToken, setRefreshToken, clearRefreshToken } from './token-store';
import { setAuthHelpers } from '../api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

async function authFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const json = await res.json();
  if (!res.ok) {
    const msg = json?.message || json?.error || `Request failed: ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json && typeof json === 'object' && 'data' in json ? (json.data as T) : (json as T);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const accessTokenRef = useRef<string | null>(null);

  // Keep ref in sync for the API client helper
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const clearSession = useCallback(async () => {
    setUser(null);
    setAccessToken(null);
    accessTokenRef.current = null;
    await clearRefreshToken();
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    const token = await getRefreshToken();
    if (!token) {
      console.log('[Auth] No refresh token found, skip restore');
      return false;
    }
    try {
      console.log('[Auth] Refreshing session...');
      const data = await authFetch<TokenResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: token }),
      });
      setAccessToken(data.access_token);
      accessTokenRef.current = data.access_token;
      setUser(data.user);
      await setRefreshToken(data.refresh_token);
      console.log('[Auth] Session refreshed for', data.user.email);
      return true;
    } catch (err) {
      console.warn('[Auth] Refresh failed:', err instanceof Error ? err.message : err);
      await clearSession();
      return false;
    }
  }, [clearSession]);

  // Wire auth helpers into the API client so all requests get the token
  useEffect(() => {
    setAuthHelpers({
      getAccessToken: () => accessTokenRef.current,
      refreshSession,
      clearSession,
    });
  }, [refreshSession, clearSession]);

  // Restore session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refreshSession();
      if (!cancelled) setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [refreshSession]);

  // Refresh when app comes to foreground
  useEffect(() => {
    const handle = (state: AppStateStatus) => {
      if (state === 'active' && accessTokenRef.current) refreshSession();
    };
    const sub = AppState.addEventListener('change', handle);
    return () => sub.remove();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    console.log('[Auth] Login attempt for', email);
    const data = await authFetch<TokenResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAccessToken(data.access_token);
    accessTokenRef.current = data.access_token;
    setUser(data.user);
    await setRefreshToken(data.refresh_token);
    console.log('[Auth] Login success:', data.user.email, 'role:', data.user.role);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    console.log('[Auth] Register attempt for', email);
    await authFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, role: 'holder' }),
    });
    console.log('[Auth] Registration success, auto-logging in...');
    await login(email, password);
  }, [login]);

  const logout = useCallback(async () => {
    console.log('[Auth] Logging out...');
    if (accessTokenRef.current) {
      try {
        await authFetch('/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessTokenRef.current}` },
        });
      } catch { /* ignore */ }
    }
    await clearSession();
    console.log('[Auth] Logged out');
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
