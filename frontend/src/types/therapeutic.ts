export interface PeptideCompound {
  id?: number;
  compoundName: string;
  amountMg: number;
}

export interface Peptide {
  id: number;
  name: string;
  totalAmountMg: number;
  bacWaterMl: number | null;
  concentrationMgPerMl: number | null;
  compounds: PeptideCompound[];
  notes: string | null;
  active: boolean;
  createdAt: string;
}

export interface Medication {
  id: number;
  name: string;
  dosageAmount: number | null;
  dosageUnit: string | null;
  frequency: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
}

export interface Supplement {
  id: number;
  name: string;
  dosageAmount: number | null;
  dosageUnit: string | null;
  frequency: string | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
}

export type TherapeuticType = 'PEPTIDE' | 'MEDICATION' | 'SUPPLEMENT';

export interface TherapeuticSchedule {
  id: number;
  therapeuticType: TherapeuticType;
  therapeuticId: number;
  scheduleType: string;
  daysOfWeek: number[];
  intervalDays: number | null;
  timeOfDay: string | null;
  dosageOverride: number | null;
  dosageUnit: string | null;
  notes: string | null;
  active: boolean;
  startDate: string;
  endDate: string | null;
}

export interface TherapeuticLog {
  id: number;
  therapeuticType: TherapeuticType;
  therapeuticId: number;
  scheduleId: number | null;
  takenAt: string;
  dosageAmount: number | null;
  dosageUnit: string | null;
  notes: string | null;
  skipped: boolean;
}

export interface ReconstitutionData {
  totalAmountMg: number;
  bacWaterMl: number;
  concentrationMgPerMl: number;
  concentrationMcgPerUnit: number;
  compounds: { compoundName: string; amountMg: number; concentrationMgPerMl: number }[];
}
