import { apiClient } from './client';
import type { BodyMetric, MetricTrend } from '@/types/metrics';

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
}

export const metricsApi = {
  list: async (params?: Record<string, string>): Promise<BodyMetric[]> => {
    const mapped: Record<string, string> = {};
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        mapped[k === 'metricType' ? 'type' : k] = v;
      }
    }
    const page = await apiClient<PageResponse<BodyMetric>>('/api/v1/metrics', { params: mapped });
    return page.content ?? [];
  },
  create: (data: Record<string, unknown>) => apiClient<BodyMetric>('/api/v1/metrics', { method: 'POST', body: data }),
  update: (id: number, data: Record<string, unknown>) => apiClient<BodyMetric>(`/api/v1/metrics/${id}`, { method: 'PUT', body: data }),
  delete: (id: number) => apiClient<void>(`/api/v1/metrics/${id}`, { method: 'DELETE' }),
  latest: async (): Promise<{ metrics: Record<string, { value: number; unit: string; measuredAt: string }> }> => {
    return apiClient('/api/v1/metrics/latest');
  },
  trends: (params: Record<string, string>): Promise<MetricTrend> => {
    const mapped: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (k === 'metricType') {
        mapped['type'] = v;
      } else if (k === 'from' || k === 'to') {
        mapped[k] = new Date(v).toISOString();
      } else {
        mapped[k] = v;
      }
    }
    return apiClient<MetricTrend>('/api/v1/metrics/trends', { params: mapped });
  },
  types: () => apiClient<string[]>('/api/v1/metrics/types'),
};
