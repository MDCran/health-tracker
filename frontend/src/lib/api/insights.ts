import { apiClient } from './client';

export interface Insight {
  id: string;
  category: string;
  severity: 'POSITIVE' | 'WARNING' | 'NEGATIVE' | 'INFO';
  title: string;
  message: string;
  actionLabel: string | null;
  actionLink: string | null;
}

export interface Correlation {
  id: string;
  title: string;
  description: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  modules: string[];
}

export interface InsightsData {
  insights: Insight[];
  correlations: Correlation[];
  overallScore: string;
  overallSummary: string;
}

export const insightsApi = {
  get: () => apiClient<InsightsData>('/api/v1/insights'),
};
