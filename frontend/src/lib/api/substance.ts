import { apiClient } from './client';
import type { SubstanceLog, SubstanceStats } from '@/types/substance';

export const substanceApi = {
  log: (data: Record<string, unknown>) =>
    apiClient<SubstanceLog>('/api/v1/substance/log', { method: 'POST', body: data }),

  list: (params?: Record<string, string>) =>
    apiClient<SubstanceLog[]>('/api/v1/substance/logs', { params }),

  get: (id: number) =>
    apiClient<SubstanceLog>(`/api/v1/substance/logs/${id}`),

  update: (id: number, data: Record<string, unknown>) =>
    apiClient<SubstanceLog>(`/api/v1/substance/logs/${id}`, { method: 'PUT', body: data }),

  delete: (id: number) =>
    apiClient<void>(`/api/v1/substance/logs/${id}`, { method: 'DELETE' }),

  stats: (type: string) =>
    apiClient<SubstanceStats>('/api/v1/substance/stats', { params: { type } }),

  allStats: () =>
    apiClient<SubstanceStats[]>('/api/v1/substance/stats/all'),

  types: () =>
    apiClient<string[]>('/api/v1/substance/types'),

  customTypes: () =>
    apiClient<{ id: number; key: string; name: string; color: string }[]>('/api/v1/substance/custom-types'),

  createCustomType: (data: { name: string; color?: string }) =>
    apiClient<{ id: number; key: string; name: string; color: string }>('/api/v1/substance/custom-types', { method: 'POST', body: data }),

  deleteCustomType: (id: number) =>
    apiClient<void>(`/api/v1/substance/custom-types/${id}`, { method: 'DELETE' }),
};
