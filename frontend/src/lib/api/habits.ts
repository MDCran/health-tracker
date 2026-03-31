import { apiClient } from './client';
import type { Habit, HabitLog, HabitMilestone, DailyHabitStatus } from '@/types/habit';

export const habitsApi = {
  list: (params?: Record<string, string>) => apiClient<Habit[]>('/api/v1/habits', { params }),
  get: (id: number) => apiClient<Habit>(`/api/v1/habits/${id}`),
  create: (data: Record<string, unknown>) => apiClient<Habit>('/api/v1/habits', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<Habit>(`/api/v1/habits/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/habits/${id}`, { method: 'DELETE' }),
  log: (id: number) => apiClient<HabitLog>(`/api/v1/habits/${id}/log`, { method: 'POST' }),
  unlog: (id: number, date: string) => apiClient<void>(`/api/v1/habits/${id}/log/${date}`, { method: 'DELETE' }),
  history: (id: number, params?: Record<string, string>) => apiClient<HabitLog[]>(`/api/v1/habits/${id}/history`, { params }),
  dailyStatus: (date: string) => apiClient<DailyHabitStatus[]>('/api/v1/habits/daily-status', { params: { date } }),
  milestones: (id: number) => apiClient<HabitMilestone[]>(`/api/v1/habits/${id}/milestones`),
};
