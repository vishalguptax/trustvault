import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './constants';
import { API } from './routes';

// ── Auth helper refs (set by auth-context) ───────────────────────

let getAccessTokenFn: (() => string | null) | null = null;
let refreshSessionFn: (() => Promise<boolean>) | null = null;
let clearSessionFn: (() => Promise<void>) | null = null;

export function setAuthHelpers(helpers: {
  getAccessToken: () => string | null;
  refreshSession: () => Promise<boolean>;
  clearSession: () => Promise<void>;
}) {
  getAccessTokenFn = helpers.getAccessToken;
  refreshSessionFn = helpers.refreshSession;
  clearSessionFn = helpers.clearSession;
}

// ── Axios instance ───────────────────────────────────────────────

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor ──────────────────────────────────────────

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Attach auth token
  const token = getAccessTokenFn?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Log request
  console.log(`[API] → ${config.method?.toUpperCase()} ${config.url}`, config.data ?? '');

  // Attach timestamp for duration calculation
  (config as unknown as Record<string, unknown>)._startTime = Date.now();
  return config;
});

// ── Response interceptor ─────────────────────────────────────────

client.interceptors.response.use(
  (response) => {
    const ms = Date.now() - ((response.config as unknown as Record<string, unknown>)._startTime as number || Date.now());
    const data = response.data;

    // Unwrap backend response interceptor wrapper { success, data, ... }
    const unwrapped = data && typeof data === 'object' && 'data' in data ? data.data : data;

    console.log(`[API] ← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${ms}ms)`, unwrapped);

    response.data = unwrapped;
    return response;
  },

  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _startTime?: number };
    const ms = Date.now() - (config?._startTime || Date.now());
    const method = config?.method?.toUpperCase() ?? '?';
    const url = config?.url ?? '?';

    // Network error (no response)
    if (!error.response) {
      console.error(`[API] ✗ ${method} ${url} NETWORK (${ms}ms)`, error.message);
      return Promise.reject(new Error('Unable to connect to server. Please check your connection.'));
    }

    const status = error.response.status;
    const body = error.response.data as Record<string, unknown> | null;
    const message = body?.message || body?.error || `Request failed: ${status}`;
    const errorStr = typeof message === 'string' ? message : JSON.stringify(message);

    console.error(`[API] ✗ ${method} ${url} ${status} (${ms}ms)`, body);

    // 401 — attempt token refresh once
    if (status === 401 && !config._retry && refreshSessionFn) {
      config._retry = true;
      console.log('[API] Token expired, refreshing...');
      const refreshed = await refreshSessionFn();
      if (refreshed) {
        // Update token and retry
        const token = getAccessTokenFn?.();
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return client(config);
      }
      if (clearSessionFn) await clearSessionFn();
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }

    return Promise.reject(new Error(errorStr));
  },
);

// ── Public API ───────────────────────────────────────────────────

export const api = {
  get: <T>(path: string) =>
    client.get<T>(path).then((r) => r.data),
  post: <T>(path: string, body: unknown) =>
    client.post<T>(path, body).then((r) => r.data),
  put: <T>(path: string, body: unknown) =>
    client.put<T>(path, body).then((r) => r.data),
  delete: <T>(path: string) =>
    client.delete<T>(path).then((r) => r.data),
};

/** Fire-and-forget health check to wake the API on cold start */
export async function wakeUpApi(): Promise<boolean> {
  try {
    const res = await client.get(API.HEALTH);
    return res.status === 200;
  } catch {
    console.warn('[API] Health check failed — API may be starting up');
    return false;
  }
}
