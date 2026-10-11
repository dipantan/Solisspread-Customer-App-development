import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  saveAuthTokens,
} from './tokenStorage';
import type { ApiErrorBody, AuthTokens } from './types';

export class ApiError extends Error {
  statusCode: number;
  body?: ApiErrorBody;

  constructor(message: string, statusCode = 0, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.body = body;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean;
  /** Skip 401→refresh retry (used internally for refresh itself). */
  skipRefresh?: boolean;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const base = API_BASE_URL.replace(/\/$/, '');
  const cleaned = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${cleaned}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }
  return url.toString();
}

function friendlyMessage(status: number, body?: ApiErrorBody, fallback?: string): string {
  const raw = body?.message;
  if (Array.isArray(raw) && raw.length) return raw.join('\n');
  if (typeof raw === 'string' && raw.trim()) return raw;
  if (body?.error && typeof body.error === 'string') return body.error;
  if (fallback) return fallback;
  if (status === 0) return 'Network error. Please check your connection.';
  if (status === 401) return 'Session expired. Please log in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'Requested resource was not found.';
  if (status >= 500) return 'Server error. Please try again later.';
  return `Request failed (${status})`;
}

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

let refreshPromise: Promise<boolean> | null = null;

export async function tryRefreshTokens(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) {
      await clearAuthTokens();
      return false;
    }
    try {
      const url = buildUrl('/auth/refresh');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const json = await parseJsonSafe(res);
      if (!res.ok) {
        await clearAuthTokens();
        return false;
      }
      const data = (json?.data ?? json) as AuthTokens;
      if (!data?.accessToken || !data?.refreshToken) {
        await clearAuthTokens();
        return false;
      }
      await saveAuthTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      return true;
    } catch {
      await clearAuthTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    body,
    query,
    auth = true,
    skipRefresh = false,
    headers = {},
    timeoutMs = API_TIMEOUT_MS,
  } = options;

  const url = buildUrl(path, query);
  const finalHeaders: Record<string, string> = {
    Accept: 'application/json',
    ...headers,
  };

  if (body !== undefined) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] ?? 'application/json';
  }

  if (auth) {
    const token = await getAccessToken();
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 0);
    }
    throw new ApiError('Network error. Please check your connection.', 0);
  }
  clearTimeout(timer);

  if (res.status === 401 && auth && !skipRefresh) {
    const refreshed = await tryRefreshTokens();
    if (refreshed) {
      return apiRequest<T>(path, { ...options, skipRefresh: true });
    }
  }

  const json = await parseJsonSafe(res);

  if (!res.ok) {
    const bodyErr = (json ?? {}) as ApiErrorBody;
    throw new ApiError(friendlyMessage(res.status, bodyErr), res.status, bodyErr);
  }

  // Standard envelope: { success, statusCode, timestamp, data }
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
};
