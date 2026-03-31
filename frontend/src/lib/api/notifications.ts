import { apiClient } from './client';

export interface NotificationItem {
  id: number;
  title: string;
  message: string | null;
  notificationType: string;
  referenceType: string | null;
  referenceId: number | null;
  linkUrl: string | null;
  read: boolean;
  scheduledFor: string;
  createdAt: string;
}

export const notificationsApi = {
  list: () => apiClient<NotificationItem[]>('/api/v1/notifications'),
  unreadCount: () => apiClient<{ count: number }>('/api/v1/notifications/unread-count'),
  markRead: (id: number) => apiClient<void>(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => apiClient<void>('/api/v1/notifications/read-all', { method: 'POST' }),
  dismiss: (id: number) => apiClient<void>(`/api/v1/notifications/${id}/dismiss`, { method: 'POST' }),
  dismissAll: () => apiClient<void>('/api/v1/notifications/dismiss-all', { method: 'POST' }),
};
