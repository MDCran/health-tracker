export interface ProgressPhoto {
  id: number;
  workoutSessionId: number | null;
  fileName: string;
  imageUrl: string;
  takenAt: string;
  weightKg: number | null;
  notes: string | null;
  metricsSnapshot: string | null;
  createdAt: string;
}

export interface MetricsSnapshot {
  chest?: number;
  waist?: number;
  hips?: number;
  leftArm?: number;
  rightArm?: number;
  leftThigh?: number;
  rightThigh?: number;
  shoulders?: number;
  [key: string]: number | undefined;
}
