import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { API_BASE_URL } from '../constants';
import { getRefreshToken, setRefreshToken, clearRefreshToken } from './token-store';
import { setAuthHelpers } from '../api';
import { API } from '../routes';

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
  const method = options.method || 'GET';
  const url = `${API_BASE_URL}${path}`;
  console.log(`[Auth] ${method} ${url}`);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown network error';
    console.error(`[Auth] NETWORK ERROR: ${method} ${url}`);
    console.error(`[Auth] Reason: ${msg}`);
    console.error(`[Auth] Base URL: ${API_BASE_URL}`);
    console.error(`[Auth] Checklist:`);
    console.error(`  1. Is the backend running? (pnpm dev:api)`);
    console.error(`  2. Is EXPO_PUBLIC_API_URL set to your LAN IP? (not localhost)`);
    console.error(`  3. Is your phone on the same WiFi as the server?`);
    console.error(`  4. Is the firewall allowing port 8000?`);
    throw new Error('Unable to connect to server. Please check your connection.');
  }

  console.log(`[Auth] ${method} ${path} → ${res.status}`);

  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    console.error(`[Auth] Response not JSON: ${method} ${path} status ${res.status}`);
    throw new Error(`Server returned invalid response (${res.status})`);
  }

  if (!res.ok) {
    const msg = json?.message || json?.error || `Request failed: ${res.status}`;
    const errorStr = typeof msg === 'string' ? msg : JSON.stringify(msg);
    console.error(`[Auth] ERROR: ${method} ${path} — ${errorStr}`);
    throw new Error(errorStr);
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
      const data = await authFetch<TokenResponse>(API.AUTH.REFRESH, {
        method: 'POST',
        body: JSON.stringify({ refresh_token: token }),
      });
      setAccessToken(data.access_token);
      accessTokenRef.current = data.access_token;
      if (data.user) {
        setUser(data.user);
      }
      await setRefreshToken(data.refresh_token);
      console.log('[Auth] Session refreshed for', data.user?.email ?? 'unknown');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Auth] Refresh failed:', msg);
      // Only clear session on auth errors (invalid token), NOT on network errors
      // Network errors mean the server is unreachable — keep the session so user
      // sees the lock screen instead of being forced to re-login
      const isNetworkError =
        msg.includes('Unable to connect') ||
        msg.includes('Network request failed') ||
        msg.includes('Failed to fetch') ||
        msg.includes('timeout');
      if (isNetworkError) {
        console.log('[Auth] Keeping session (network error — will retry later)');
      } else {
        console.log('[Auth] Clearing session (auth error)');
        await clearSession();
      }
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
    const data = await authFetch<TokenResponse>(API.AUTH.LOGIN, {
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
    await authFetch(API.AUTH.REGISTER, {
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
        await authFetch(API.AUTH.LOGOUT, {
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
