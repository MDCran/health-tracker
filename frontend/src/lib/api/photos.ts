import type { ProgressPhoto } from '@/types/photo';
import { API_BASE } from './client';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export const photosApi = {
  upload: async (formData: FormData): Promise<ProgressPhoto> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/photos`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  list: async (params?: Record<string, string>): Promise<ProgressPhoto[]> => {
    const url = new URL(`${API_BASE}/api/v1/photos`);
    if (params) Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
    const token = getToken();
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  get: async (id: number): Promise<ProgressPhoto> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/photos/${id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  imageUrl: (id: number): string => `${API_BASE}/api/v1/photos/${id}/image`,

  delete: async (id: number): Promise<void> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/photos/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
  },
};
