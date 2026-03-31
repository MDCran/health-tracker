export type HabitType = 'GOOD' | 'BAD';
export type HabitDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export const HABIT_CATEGORIES = [
  'Health', 'Fitness', 'Productivity', 'Mindfulness',
  'Social', 'Financial', 'Learning', 'Custom',
] as const;

export const MILESTONE_THRESHOLDS = [7, 14, 21, 30, 60, 66, 90, 100, 180, 365] as const;

export interface Habit {
  id: number;
  name: string;
  description: string | null;
  frequency: string;
  targetCount: number;
  daysOfWeek: number[];
  color: string | null;
  icon: string | null;
  active: boolean;
  habitType: HabitType;
  targetDays: number;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  daysSinceLastOccurrence: number;
  totalOccurrences: number;
  formationProgress: number;
  category: string | null;
  cue: string | null;
  routine: string | null;
  reward: string | null;
  stackAfterHabitId: number | null;
  difficulty: string | null;
  priority: number | null;
  reminderTime: string | null;
}

export interface HabitLog {
  date: string;
  completed: boolean;
  notes: string | null;
  intensity: number | null;
  mood: string | null;
  context: string | null;
  skipReason: string | null;
}

export interface HabitMilestone {
  id: number;
  habitId: number;
  milestoneType: string;
  milestoneValue: number;
  achievedAt: string;
}

export interface DailyHabitStatus {
  habitId: number;
  habitName: string;
  habitType: HabitType;
  completed: boolean;
  currentStreak: number;
  daysSinceLastOccurrence: number;
  formationProgress: number;
  targetDays: number;
  color: string | null;
}
