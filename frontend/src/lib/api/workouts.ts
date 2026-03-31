import { apiClient } from './client';
import type { Exercise, WorkoutSession, WorkoutTemplate, PersonalRecord } from '@/types/workout';
import type { PaginatedResponse } from '@/types/api';

export interface ExerciseLastSession {
  lastSets: { set_number: number; weight_kg: number; reps: number; duration_seconds: number; set_type: string }[];
  personalRecords: { record_type: string; value: number; unit: string; achieved_at: string }[];
  lastDate: string | null;
}

export interface ExerciseHistoryEntry {
  date: string;
  workout_name: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  duration_seconds: number;
  set_type: string;
}

export const exerciseApi = {
  search: (params?: Record<string, string>) => apiClient<Exercise[]>('/api/v1/exercises', { params }),
  autocomplete: (q: string) => apiClient<Exercise[]>('/api/v1/exercises/autocomplete', { params: { q } }),
  get: (id: number) => apiClient<Exercise>(`/api/v1/exercises/${id}`),
  createCustom: (data: Record<string, unknown>) => apiClient<Exercise>('/api/v1/exercises', { method: 'POST', body: data }),
  muscleGroups: () => apiClient<string[]>('/api/v1/exercises/muscle-groups'),
  categories: () => apiClient<string[]>('/api/v1/exercises/categories'),
  history: (id: number) => apiClient<ExerciseHistoryEntry[]>(`/api/v1/exercises/${id}/history`),
  lastSession: (id: number) => apiClient<ExerciseLastSession>(`/api/v1/exercises/${id}/last-session`),
};

export const workoutApi = {
  list: (params?: Record<string, string>) => apiClient<PaginatedResponse<WorkoutSession>>('/api/v1/workouts', { params }),
  get: (id: number) => apiClient<WorkoutSession>(`/api/v1/workouts/${id}`),
  create: (data: Record<string, unknown>) => apiClient<WorkoutSession>('/api/v1/workouts', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<WorkoutSession>(`/api/v1/workouts/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/workouts/${id}`, { method: 'DELETE' }),
  start: (id: number) => apiClient<WorkoutSession>(`/api/v1/workouts/${id}/start`, { method: 'POST' }),
  finish: (id: number) => apiClient<WorkoutSession>(`/api/v1/workouts/${id}/finish`, { method: 'POST' }),
  addExercise: (id: number, data: Record<string, unknown>) => apiClient(`/api/v1/workouts/${id}/exercises`, { method: 'POST', body: data }),
  updateExercise: (id: number, exId: number, data: Record<string, unknown>) => apiClient(`/api/v1/workouts/${id}/exercises/${exId}`, { method: 'PUT', body: data }),
  removeExercise: (id: number, exId: number) => apiClient(`/api/v1/workouts/${id}/exercises/${exId}`, { method: 'DELETE' }),
  addSet: (id: number, exId: number, data: Record<string, unknown>) => apiClient(`/api/v1/workouts/${id}/exercises/${exId}/sets`, { method: 'POST', body: data }),
  updateSet: (id: number, exId: number, setId: number, data: Record<string, unknown>) => apiClient(`/api/v1/workouts/${id}/exercises/${exId}/sets/${setId}`, { method: 'PUT', body: data }),
  removeSet: (id: number, exId: number, setId: number) => apiClient(`/api/v1/workouts/${id}/exercises/${exId}/sets/${setId}`, { method: 'DELETE' }),
};

export const templateApi = {
  list: () => apiClient<WorkoutTemplate[]>('/api/v1/workout-templates'),
  get: (id: number) => apiClient<WorkoutTemplate>(`/api/v1/workout-templates/${id}`),
  create: (data: Record<string, unknown>) => apiClient<WorkoutTemplate>('/api/v1/workout-templates', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<WorkoutTemplate>(`/api/v1/workout-templates/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/workout-templates/${id}`, { method: 'DELETE' }),
};

export const prApi = {
  list: () => apiClient<PersonalRecord[]>('/api/v1/personal-records'),
  forExercise: (exerciseId: number) => apiClient<PersonalRecord[]>(`/api/v1/personal-records/exercise/${exerciseId}`),
  recent: () => apiClient<PersonalRecord[]>('/api/v1/personal-records/recent'),
};
