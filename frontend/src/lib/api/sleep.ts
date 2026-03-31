import { apiClient } from './client';
import type { SleepEntry, SleepStats } from '@/types/sleep';
import type { PaginatedResponse } from '@/types/api';

export const sleepApi = {
  list: (params?: Record<string, string>) =>
    apiClient<PaginatedResponse<SleepEntry>>('/api/v1/sleep/entries', { params }),
  get: (date: string) =>
    apiClient<SleepEntry>(`/api/v1/sleep/entries/${date}`),
  create: (data: Record<string, unknown>) =>
    apiClient<SleepEntry>('/api/v1/sleep/entries', { method: 'POST', body: data }),
  delete: (date: string) =>
    apiClient<void>(`/api/v1/sleep/entries/${date}`, { method: 'DELETE' }),
  stats: (params: Record<string, string>) =>
    apiClient<SleepStats>('/api/v1/sleep/stats', { params }),
};
