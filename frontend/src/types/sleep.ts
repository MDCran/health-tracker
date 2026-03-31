export interface SleepEntry {
  id: number;
  date: string;
  bedtime: string;
  wakeTime: string;
  totalMinutes: number;
  sleepQuality: number;
  feelRested: number;
  sleepLatencyMin: number;
  notes: string | null;
  surveyResponses: Record<string, number> | null;
  interruptions: SleepInterruption[];
  estimatedSleepStages: { light: number; deep: number; rem: number; awake: number } | null;
}

export interface SleepInterruption {
  wokeAt: string;
  fellBackAt: string | null;
  durationMin: number;
  reason: string | null;
}

export interface SleepStats {
  avgSleepHours: number;
  avgQuality: number;
  avgInterruptions: number;
  avgLatency: number;
  dataPoints: { date: string; hours: number; quality: number }[];
}
