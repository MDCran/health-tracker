import { apiClient } from './client';
import type { CalendarDay } from '@/types/calendar';

export const calendarApi = {
  getRange: (from: string, to: string) =>
    apiClient<CalendarDay[]>('/api/v1/calendar', { params: { from, to } }),
  getDate: (date: string) => apiClient<CalendarDay>(`/api/v1/calendar/${date}`),
};
