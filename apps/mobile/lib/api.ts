import { API_BASE_URL } from './constants';

const TAG = '[API]';

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
  const method = options.method || 'GET';
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getAccessTokenFn?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log(`${TAG} ${method} ${path}`);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${TAG} NETWORK ERROR: ${method} ${url}`);
    console.error(`${TAG} Reason: ${msg}`);
    console.error(`${TAG} Base URL: ${API_BASE_URL}`);
    throw new Error('Unable to connect to server. Please check your connection.');
  }

  console.log(`${TAG} ${method} ${path} → ${response.status}`);

  // Handle 401 — attempt refresh and retry once
  if (response.status === 401 && retry && refreshSessionFn) {
    console.log(`${TAG} 401 received, attempting token refresh...`);
    const refreshed = await refreshSessionFn();
    if (refreshed) {
      console.log(`${TAG} Token refreshed, retrying ${method} ${path}`);
      return request<T>(path, options, false);
    }
    console.warn(`${TAG} Token refresh failed, clearing session`);
    if (clearSessionFn) await clearSessionFn();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    const json = await response.json().catch(() => null);
    const message = json?.message || json?.error || `Request failed: ${response.status}`;
    const errorStr = typeof message === 'string' ? message : JSON.stringify(message);
    console.error(`${TAG} ERROR ${response.status}: ${method} ${path} — ${errorStr}`);
    throw new Error(errorStr);
  }

  const json = await response.json();
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
