import { API_BASE_URL } from './constants';

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

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessTokenFn?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[API] Network error: ${options.method || 'GET'} ${url} — ${msg}`);
    throw new Error(`Cannot connect to server (${API_BASE_URL}). Is the backend running?`);
  }

  // Handle 401 — attempt refresh and retry once
  if (response.status === 401 && retry && refreshSessionFn) {
    const refreshed = await refreshSessionFn();
    if (refreshed) {
      return request<T>(path, options, false);
    }
    if (clearSessionFn) await clearSessionFn();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    const message = json?.message || json?.error || `Request failed: ${response.status}`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  const json = await response.json();
  // Support { success, data } wrapper and direct responses
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
