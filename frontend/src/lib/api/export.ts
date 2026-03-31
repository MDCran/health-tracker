import { API_BASE } from './client';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

export async function exportPdf(sections: string[], from: string, to: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_BASE}/api/v1/export/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ sections, from, to }),
  });

  if (!res.ok) throw new Error('Export failed');

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `health-report-${from}-to-${to}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
