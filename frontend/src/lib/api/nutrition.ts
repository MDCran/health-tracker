import { apiClient, API_BASE } from './client';
import type { NutritionDay, Meal, FoodEntry, NutritionGoal, FoodAnalysisResult } from '@/types/nutrition';

export const nutritionApi = {
  getDays: (params?: Record<string, string>) => apiClient<NutritionDay[]>('/api/v1/nutrition/days', { params }),
  getDay: (date: string) => apiClient<NutritionDay>(`/api/v1/nutrition/days/${date}`),
  addMeal: (date: string, data: Record<string, unknown>) => apiClient<Meal>(`/api/v1/nutrition/days/${date}/meals`, { method: 'POST', body: data }),
  updateMeal: (mealId: number, data: Record<string, unknown>) => apiClient<Meal>(`/api/v1/nutrition/meals/${mealId}`, { method: 'PUT', body: data }),
  deleteMeal: (mealId: number) => apiClient<void>(`/api/v1/nutrition/meals/${mealId}`, { method: 'DELETE' }),
  addFood: (mealId: number, data: Record<string, unknown>) => apiClient<FoodEntry>(`/api/v1/nutrition/meals/${mealId}/foods`, { method: 'POST', body: data }),
  updateFood: (foodId: number, data: Record<string, unknown>) => apiClient<FoodEntry>(`/api/v1/nutrition/foods/${foodId}`, { method: 'PUT', body: data }),
  deleteFood: (foodId: number) => apiClient<void>(`/api/v1/nutrition/foods/${foodId}`, { method: 'DELETE' }),
  analyze: (description: string) => apiClient<FoodAnalysisResult>('/api/v1/nutrition/analyze', { method: 'POST', body: { description } }),
  getGoals: () => apiClient<NutritionGoal>('/api/v1/nutrition/goals'),
  setGoals: (data: NutritionGoal) => apiClient<NutritionGoal>('/api/v1/nutrition/goals', { method: 'PUT', body: data }),

  analyzeImage: async (file: File): Promise<FoodAnalysisResult> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/v1/nutrition/analyze-image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  uploadFoodImage: async (foodId: number, file: File): Promise<FoodEntry> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/api/v1/nutrition/foods/${foodId}/image`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  getFoodImageUrl: (foodId: number): string => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    return `${API_BASE}/api/v1/nutrition/foods/${foodId}/image?token=${token}`;
  },

  exportCsv: async (from: string, to: string): Promise<void> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const res = await fetch(`${API_BASE}/api/v1/nutrition/export?from=${from}&to=${to}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Export failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrition_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
