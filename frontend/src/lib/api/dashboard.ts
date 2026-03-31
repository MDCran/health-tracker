import { apiClient } from './client';

export interface DashboardData {
  workouts: {
    totalSessions: number;
    totalExercises: number;
    totalSets: number;
    totalVolumeKg: number;
    newPrs: number;
    frequencyByDay: { date: string; count: number }[];
  };
  nutrition: {
    avgCalories: number;
    avgProteinG: number;
    avgCarbsG: number;
    avgFatG: number;
    daysLogged: number;
    dailyCalories: { date: string; calories: number }[];
  };
  journal: {
    avgOverallRating: number;
    realmAverages: Record<string, number>;
    entriesCount: number;
    ratingTrend: { date: string; overall_rating: number }[];
  };
  habits: {
    activeHabits: number;
    overallCompletionRate: number;
    longestStreak: number;
  };
  therapeutics: {
    activePeptides: number;
    activeMedications: number;
    activeSupplements: number;
    adherenceRate: number;
    completedCount: number;
  };
  metrics: {
    currentWeight: number | null;
    weightChange: number;
    weightTrend: { date: string; value: number }[];
  };
}

export const dashboardApi = {
  get: (params?: Record<string, string>) => apiClient<DashboardData>('/api/v1/dashboard', { params }),
};
