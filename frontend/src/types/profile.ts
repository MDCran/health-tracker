export interface UserProfile {
  id: number;
  username: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  heightCm: number | null;
  weightKg: number | null;
  unitSystem: string;
  gender: string | null;
  activityLevel: string | null;
  dietGoal: string | null;
  targetWeeklyChangeKg: number | null;
  hasAvatar: boolean;
  googleConnected: boolean;
  sidebarConfig: string | null;
  hasOpenaiKey: boolean;
  openaiApiKeyMasked: string | null;
  openaiApiKey?: string;
  age: number | null;
  bmr: number | null;
  tdee: number | null;
  recommendedTargets: NutritionTargets | null;
}

export interface NutritionTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
}

export const ACTIVITY_LEVELS = [
  { value: 'SEDENTARY', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: 'LIGHT', label: 'Light', desc: '1-3 days/week' },
  { value: 'MODERATE', label: 'Moderate', desc: '3-5 days/week' },
  { value: 'ACTIVE', label: 'Active', desc: '6-7 days/week' },
  { value: 'VERY_ACTIVE', label: 'Very Active', desc: 'Athlete / physical job' },
] as const;

export const DIET_GOALS = [
  { value: 'CUT', label: 'Cut', desc: 'Lose fat (-20% calories)', color: 'text-danger' },
  { value: 'MAINTAIN', label: 'Maintain', desc: 'Stay at current weight', color: 'text-info' },
  { value: 'BULK', label: 'Bulk', desc: 'Build muscle (+15% calories)', color: 'text-success' },
] as const;
