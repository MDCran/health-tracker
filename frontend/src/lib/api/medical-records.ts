import { API_BASE } from './client';

export interface MedicalRecord {
  id: number;
  name: string;
  providerName: string | null;
  doctorName: string | null;
  recordDate: string | null;
  driveFileId: string | null;
  mimeType: string | null;
  fileSize: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export const medicalRecordsApi = {
  upload: async (formData: FormData): Promise<MedicalRecord> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/medical-records`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  list: async (): Promise<MedicalRecord[]> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/medical-records`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  get: async (id: number): Promise<MedicalRecord> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/medical-records/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  fileUrl: (id: number): string => `${API_BASE}/api/v1/medical-records/${id}/file`,

  delete: async (id: number): Promise<void> => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/api/v1/medical-records/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(await res.text());
  },
};
