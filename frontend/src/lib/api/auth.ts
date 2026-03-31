import { apiClient } from './client';
import { AuthResponse, UserProfile } from '@/types/profile';

export const authApi = {
  register: (username: string, password: string) =>
    apiClient<AuthResponse>('/api/v1/auth/register', {
      method: 'POST',
      body: { username, password },
    }),

  login: (username: string, password: string) =>
    apiClient<AuthResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: { username, password },
    }),

  me: () => apiClient<UserProfile>('/api/v1/auth/me'),
};

import { API_BASE } from './client';

export const profileApi = {
  get: () => apiClient<UserProfile>('/api/v1/profile'),

  update: (data: Partial<UserProfile>) =>
    apiClient<UserProfile>('/api/v1/profile', { method: 'PUT', body: data }),

  deleteAccount: () =>
    apiClient<void>('/api/v1/profile', { method: 'DELETE' }),

  uploadAvatar: async (file: File): Promise<UserProfile> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/v1/profile/avatar`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  avatarUrl: (): string => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    return `${API_BASE}/api/v1/profile/avatar?token=${token}`;
  },
};
