export interface Exercise {
  id: number;
  name: string;
  forceType: string | null;
  level: string | null;
  mechanic: string | null;
  equipment: string | null;
  category: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  bodyPart: string | null;
  targetMuscle: string | null;
  gifUrl: string | null;
  videoUrls: string[] | null;
  description: string | null;
  difficulty: string | null;
  source: string | null;
  isCustom: boolean;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  exercises: WorkoutTemplateExercise[];
}

export interface WorkoutTemplateExercise {
  id: number;
  exerciseId: number;
  exerciseName: string;
  exerciseOrder: number;
  targetSets: number | null;
  targetReps: number | null;
  targetWeightKg: number | null;
  restSeconds: number | null;
}

export interface WorkoutSession {
  id: number;
  templateId: number | null;
  name: string | null;
  date: string;
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number | null;
  notes: string | null;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  id: number;
  exercise: Exercise;
  exerciseOrder: number;
  notes: string | null;
  restSeconds: number | null;
  startedAt: string | null;
  finishedAt: string | null;
  durationSeconds: number | null;
  sets: ExerciseSet[];
}

export interface ExerciseSet {
  id: number;
  setNumber: number;
  setType: string;
  reps: number | null;
  weightKg: number | null;
  durationSeconds: number | null;
  restSeconds: number | null;
  completed: boolean;
  rpe: number | null;
  notes: string | null;
}

export interface PersonalRecord {
  id: number;
  exerciseId: number;
  exerciseName: string;
  recordType: string;
  value: number;
  unit: string;
  weightKg: number | null;
  reps: number | null;
  setNumber: number | null;
  achievedAt: string;
}
