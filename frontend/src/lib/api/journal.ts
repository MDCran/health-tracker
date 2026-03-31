import { apiClient } from './client';
import type { JournalEntry, RealmAverage } from '@/types/journal';
import type { PaginatedResponse } from '@/types/api';

export const journalApi = {
  list: (params?: Record<string, string>) => apiClient<PaginatedResponse<JournalEntry>>('/api/v1/journal', { params }),
  get: (date: string) => apiClient<JournalEntry>(`/api/v1/journal/${date}`),
  create: (data: Record<string, unknown>) => apiClient<JournalEntry>('/api/v1/journal', { method: 'POST', body: data }),
  update: (date: string, data: Record<string, unknown>) => apiClient<JournalEntry>(`/api/v1/journal/${date}`, { method: 'PUT', body: data }),
  delete: (date: string) => apiClient<void>(`/api/v1/journal/${date}`, { method: 'DELETE' }),
  realmAverages: (params?: Record<string, string>) => apiClient<RealmAverage[]>('/api/v1/journal/realm-averages', { params }),
};
