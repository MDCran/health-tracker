import { apiClient } from './client';
import type { Peptide, Medication, Supplement, TherapeuticSchedule, TherapeuticLog, ReconstitutionData } from '@/types/therapeutic';

export const peptideApi = {
  list: () => apiClient<Peptide[]>('/api/v1/peptides'),
  get: (id: number) => apiClient<Peptide>(`/api/v1/peptides/${id}`),
  create: (data: Record<string, unknown>) => apiClient<Peptide>('/api/v1/peptides', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<Peptide>(`/api/v1/peptides/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/peptides/${id}`, { method: 'DELETE' }),
  reconstitution: (id: number) => apiClient<ReconstitutionData>(`/api/v1/peptides/${id}/reconstitution`),
};

export const medicationApi = {
  list: () => apiClient<Medication[]>('/api/v1/medications'),
  get: (id: number) => apiClient<Medication>(`/api/v1/medications/${id}`),
  create: (data: Record<string, unknown>) => apiClient<Medication>('/api/v1/medications', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<Medication>(`/api/v1/medications/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/medications/${id}`, { method: 'DELETE' }),
};

export const supplementApi = {
  list: () => apiClient<Supplement[]>('/api/v1/supplements'),
  get: (id: number) => apiClient<Supplement>(`/api/v1/supplements/${id}`),
  create: (data: Record<string, unknown>) => apiClient<Supplement>('/api/v1/supplements', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<Supplement>(`/api/v1/supplements/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/supplements/${id}`, { method: 'DELETE' }),
};

export const scheduleApi = {
  list: (params?: Record<string, string>) => apiClient<TherapeuticSchedule[]>('/api/v1/therapeutic-schedules', { params }),
  create: (data: Record<string, unknown>) => apiClient<TherapeuticSchedule>('/api/v1/therapeutic-schedules', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<TherapeuticSchedule>(`/api/v1/therapeutic-schedules/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/therapeutic-schedules/${id}`, { method: 'DELETE' }),
};

export const therapeuticLogApi = {
  list: (params?: Record<string, string>) => apiClient<TherapeuticLog[]>('/api/v1/therapeutic-logs', { params }),
  create: (data: Record<string, unknown>) => apiClient<TherapeuticLog>('/api/v1/therapeutic-logs', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<TherapeuticLog>(`/api/v1/therapeutic-logs/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/therapeutic-logs/${id}`, { method: 'DELETE' }),
};
