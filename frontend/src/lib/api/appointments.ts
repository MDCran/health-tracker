import { apiClient } from './client';

export interface Appointment {
  id: number;
  title: string;
  doctorName: string | null;
  officeName: string | null;
  specialty: string | null;
  location: string | null;
  appointmentDate: string;
  appointmentTime: string | null;
  durationMinutes: number | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export const appointmentsApi = {
  list: (params?: Record<string, string>) =>
    apiClient<Appointment[]>('/api/v1/appointments', { params }),
  get: (id: number) =>
    apiClient<Appointment>(`/api/v1/appointments/${id}`),
  create: (data: Record<string, unknown>) =>
    apiClient<Appointment>('/api/v1/appointments', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) =>
    apiClient<Appointment>(`/api/v1/appointments/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) =>
    apiClient<void>(`/api/v1/appointments/${id}`, { method: 'DELETE' }),
};
