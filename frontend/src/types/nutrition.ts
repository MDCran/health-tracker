export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface FoodEntry {
  id: number;
  description: string;
  servingSize: string | null;
  servingSizeG: number | null;
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  cholesterolMg: number | null;
  saturatedFatG: number | null;
  transFatG: number | null;
  addedSugarsG: number | null;
  potassiumMg: number | null;
  aiAnalyzed: boolean;
  manuallyAdjusted: boolean;
}

export interface Meal {
  id: number;
  mealType: MealType;
  name: string | null;
  eatenAt: string | null;
  foods: FoodEntry[];
  foodEntries?: FoodEntry[];
}

export interface NutritionDay {
  id: number;
  date: string;
  meals: Meal[];
  totals: DailyTotals;
}

export interface DailyTotals {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  cholesterolMg: number;
  saturatedFatG: number;
  transFatG: number;
  potassiumMg: number;
}

export interface NutritionGoal {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  fiberG: number | null;
}

export interface AnalyzedFood {
  name: string;
  servingSize: string;
  servingSizeG: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sugarG: number;
  sodiumMg: number;
  cholesterolMg: number;
  saturatedFatG: number;
  transFatG: number;
  addedSugarsG: number;
  potassiumMg: number;
}

export interface FoodAnalysisResult {
  foods: AnalyzedFood[];
  totals: {
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
    sugarG: number;
    sodiumMg: number;
    cholesterolMg: number;
    saturatedFatG: number;
  };
  confidence: string;
  notes: string;
}

export const FDA_DAILY_VALUES = {
  fatG: 78,
  saturatedFatG: 20,
  cholesterolMg: 300,
  sodiumMg: 2300,
  carbsG: 275,
  fiberG: 28,
  proteinG: 50,
  potassiumMg: 4700,
  addedSugarsG: 50,
  calories: 2000,
};
