import { apiClient } from './client';

export interface SearchResult {
  category: string;
  id: number;
  title: string;
  subtitle: string | null;
  url: string;
  icon: string | null;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
}

export const searchApi = {
  search: (q: string, limit = 20) =>
    apiClient<SearchResponse>('/api/v1/search', { params: { q, limit: String(limit) } }),
};
