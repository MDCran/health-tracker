import { ApiError } from '@/types/api';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9147';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  params?: Record<string, string>;
  signal?: AbortSignal;
};

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export async function apiClient<T>(endpoint: string, options?: RequestOptions): Promise<T> {
  const url = new URL(`${API_BASE}${endpoint}`);
  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    });
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: options?.method ?? 'GET',
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
    signal: options?.signal,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || `Request failed with status ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : ({} as T);
}
