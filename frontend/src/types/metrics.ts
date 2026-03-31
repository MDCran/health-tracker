export type MetricType =
  | 'WEIGHT' | 'LEFT_ARM' | 'RIGHT_ARM' | 'LEFT_WRIST' | 'RIGHT_WRIST'
  | 'LEFT_THIGH' | 'RIGHT_THIGH' | 'CHEST' | 'HIPS' | 'WAIST'
  | 'NECK' | 'SHOULDERS' | 'FOREARM' | 'LEFT_CALF' | 'RIGHT_CALF'
  | 'ABDOMEN'
  | 'BODY_FAT' | 'BMI' | 'SKELETAL_MUSCLE' | 'MUSCLE_MASS'
  | 'BMR' | 'FAT_FREE_WEIGHT' | 'SUBCUTANEOUS_FAT' | 'VISCERAL_FAT'
  | 'BODY_WATER' | 'BONE_MASS' | 'METABOLIC_AGE' | 'PROTEIN_PCT'
  | 'WAIST_HIP_RATIO' | 'CHEST_HIP_RATIO' | 'WAIST_CHEST_RATIO'
  | 'CUSTOM';

export const MEASUREMENT_GROUPS = {
  'Body Weight & Composition': ['WEIGHT', 'BODY_FAT', 'BMI', 'SKELETAL_MUSCLE', 'MUSCLE_MASS', 'FAT_FREE_WEIGHT', 'BODY_WATER', 'BONE_MASS', 'PROTEIN_PCT'],
  'Metabolic': ['BMR', 'METABOLIC_AGE', 'SUBCUTANEOUS_FAT', 'VISCERAL_FAT'],
  'Upper Body': ['CHEST', 'SHOULDERS', 'LEFT_ARM', 'RIGHT_ARM', 'LEFT_WRIST', 'RIGHT_WRIST', 'NECK'],
  'Midsection': ['WAIST', 'HIPS', 'ABDOMEN'],
  'Lower Body': ['LEFT_THIGH', 'RIGHT_THIGH', 'LEFT_CALF', 'RIGHT_CALF'],
  'Ratios': ['WAIST_HIP_RATIO', 'CHEST_HIP_RATIO', 'WAIST_CHEST_RATIO'],
  'Other': ['CUSTOM'],
} as const;

export const METRIC_LABELS: Record<string, string> = {
  WEIGHT: 'Weight', BODY_FAT: 'Body Fat %', BMI: 'BMI',
  SKELETAL_MUSCLE: 'Skeletal Muscle %', MUSCLE_MASS: 'Muscle Mass',
  BMR: 'BMR (kcal)', FAT_FREE_WEIGHT: 'Fat-Free Weight', BODY_WATER: 'Body Water %',
  BONE_MASS: 'Bone Mass', METABOLIC_AGE: 'Metabolic Age', PROTEIN_PCT: 'Protein %',
  SUBCUTANEOUS_FAT: 'Subcutaneous Fat %', VISCERAL_FAT: 'Visceral Fat',
  CHEST: 'Chest', SHOULDERS: 'Shoulders', LEFT_ARM: 'Left Arm', RIGHT_ARM: 'Right Arm',
  LEFT_WRIST: 'Left Wrist', RIGHT_WRIST: 'Right Wrist', NECK: 'Neck',
  WAIST: 'Waist', HIPS: 'Hips', ABDOMEN: 'Abdomen',
  LEFT_THIGH: 'Left Thigh', RIGHT_THIGH: 'Right Thigh',
  LEFT_CALF: 'Left Calf', RIGHT_CALF: 'Right Calf',
  WAIST_HIP_RATIO: 'Waist-Hip Ratio', CHEST_HIP_RATIO: 'Chest-Hip Ratio',
  WAIST_CHEST_RATIO: 'Waist-Chest Ratio',
  CUSTOM: 'Custom',
};

export const METRIC_UNITS: Record<string, string> = {
  WEIGHT: 'kg', BODY_FAT: '%', BMI: '', SKELETAL_MUSCLE: '%', MUSCLE_MASS: 'kg',
  BMR: 'kcal', FAT_FREE_WEIGHT: 'kg', BODY_WATER: '%', BONE_MASS: 'kg',
  METABOLIC_AGE: 'years', PROTEIN_PCT: '%', SUBCUTANEOUS_FAT: '%', VISCERAL_FAT: '',
  CHEST: 'in', SHOULDERS: 'in', LEFT_ARM: 'in', RIGHT_ARM: 'in',
  LEFT_WRIST: 'in', RIGHT_WRIST: 'in', NECK: 'in',
  WAIST: 'in', HIPS: 'in', ABDOMEN: 'in',
  LEFT_THIGH: 'in', RIGHT_THIGH: 'in', LEFT_CALF: 'in', RIGHT_CALF: 'in',
  WAIST_HIP_RATIO: '', CHEST_HIP_RATIO: '', WAIST_CHEST_RATIO: '',
  CUSTOM: '',
};

export interface BodyMetric {
  id: number;
  metricType: MetricType;
  customName: string | null;
  value: number;
  unit: string;
  measuredAt: string;
  notes: string | null;
}

export interface MetricTrend {
  metricType: MetricType;
  dataPoints: { date: string; value: number }[];
}
