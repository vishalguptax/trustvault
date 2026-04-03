import { API_BASE_URL } from '@/lib/constants';

interface ApiError {
  error: string;
  statusCode: number;
  message: string;
}

let getTokenFn: (() => string | null) | null = null;
let refreshFn: (() => Promise<boolean>) | null = null;
let onUnauthorizedFn: (() => void) | null = null;

/** Called by auth-store to wire token access into the API client. */
export function setAuthHelpers(
  getToken: () => string | null,
  tryRefresh: () => Promise<boolean>,
  onUnauthorized: () => void,
) {
  getTokenFn = getToken;
  refreshFn = tryRefresh;
  onUnauthorizedFn = onUnauthorized;
}

async function request<T>(path: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const token = getTokenFn?.();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, { ...options, headers });

  // On 401, try refreshing the token once before giving up
  if (response.status === 401 && !isRetry && refreshFn) {
    const refreshed = await refreshFn();
    if (refreshed) {
      return request<T>(path, options, true);
    }
    onUnauthorizedFn?.();
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const error: ApiError = await response.json();
      message = error.message || message;
    } catch {
      // Response body was not JSON
    }
    throw new Error(message);
  }

  const json = await response.json();
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

/** Fire-and-forget health check to wake the API on cold start */
export async function wakeUpApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
