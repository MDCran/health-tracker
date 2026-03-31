export type SubstanceType = 'ALCOHOL' | 'DRUG';

export const SUBSTANCE_TYPES: { value: SubstanceType; label: string; icon: string; color: string }[] = [
  { value: 'ALCOHOL', label: 'Alcohol', icon: 'wine', color: '#8b5cf6' },
  { value: 'DRUG', label: 'Drugs', icon: 'pill', color: '#ef4444' },
];

export interface SubstanceLog {
  id: number;
  substanceType: SubstanceType;
  occurredAt: string;
  amount: string | null;
  notes: string | null;
  context: string | null;
  moodBefore: number | null;
  moodAfter: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubstanceStats {
  substanceType: string;
  daysSinceLast: number;
  totalOccurrences: number;
  occurrencesThisWeek: number;
  occurrencesThisMonth: number;
  avgMoodBefore: number;
  avgMoodAfter: number;
  longestCleanStreak: number;
  currentCleanStreak: number;
  weeklyTrend: { week: string; count: number }[];
}
