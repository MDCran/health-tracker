import { apiClient } from './client';

export interface VitalReading {
  id: number;
  vitalType: string;
  customName: string | null;
  value: number;
  value2: number | null;
  unit: string | null;
  measuredAt: string;
  notes: string | null;
}

export const VITAL_TYPES = [
  { key: 'BLOOD_PRESSURE', label: 'Blood Pressure', unit: 'mmHg', hasValue2: true, v1Label: 'Systolic', v2Label: 'Diastolic' },
  { key: 'RESTING_HEART_RATE', label: 'Resting Heart Rate', unit: 'bpm', hasValue2: false },
  { key: 'HRV', label: 'Heart Rate Variability', unit: 'ms', hasValue2: false },
  { key: 'BODY_TEMPERATURE', label: 'Body Temperature', unit: '°F', hasValue2: false },
  { key: 'BLOOD_OXYGEN', label: 'Blood Oxygen (SpO2)', unit: '%', hasValue2: false },
  { key: 'BLOOD_GLUCOSE', label: 'Blood Glucose', unit: 'mg/dL', hasValue2: false },
  { key: 'RESPIRATORY_RATE', label: 'Respiratory Rate', unit: 'br/min', hasValue2: false },
  { key: 'WEIGHT', label: 'Weight', unit: 'lbs', hasValue2: false },
] as const;

export const vitalsApi = {
  list: (params?: Record<string, string>) =>
    apiClient<VitalReading[]>('/api/v1/vitals', { params }),
  create: (data: Record<string, unknown>) =>
    apiClient<VitalReading>('/api/v1/vitals', { method: 'POST', body: data }),
  delete: (id: number) =>
    apiClient<void>(`/api/v1/vitals/${id}`, { method: 'DELETE' }),
  latest: () =>
    apiClient<Record<string, VitalReading>>('/api/v1/vitals/latest'),
  types: () =>
    apiClient<string[]>('/api/v1/vitals/types'),
};
