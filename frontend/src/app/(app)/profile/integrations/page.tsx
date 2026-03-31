'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, AlertCircle, Link01, XCircle, Eye, EyeOff } from '@untitled-ui/icons-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api/client';
import { profileApi } from '@/lib/api/auth';
import type { UserProfile } from '@/types/profile';

interface IntegrationStatus {
  googleDrive: {
    configured: boolean;
    connected: boolean;
    folderId: string;
  };
}

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [openaiKey, setOpenaiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: status, isLoading } = useQuery<IntegrationStatus>({
    queryKey: ['integration-status'],
    queryFn: () => apiClient('/api/v1/integrations/status'),
  });

  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiClient('/api/v1/integrations/google/disconnect', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['integration-status'] }),
  });

  const saveKeysMutation = useMutation({
    mutationFn: (data: { openaiApiKey: string }) =>
      apiClient('/api/v1/profile', { method: 'PUT', body: data }),
    onSuccess: (updated) => {
      setSaveStatus('saved');
      setOpenaiKey('');
      queryClient.setQueryData(['profile'], updated);
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data === 'google-drive-connected') {
        queryClient.invalidateQueries({ queryKey: ['integration-status'] });
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient]);

  function handleConnectGoogle() {
    apiClient<{ url: string }>('/api/v1/integrations/google/auth-url')
      .then((data) => {
        window.open(data.url, 'google-oauth', 'width=600,height=700');
      })
      .catch(() => alert('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in the .env file.'));
  }

  function handleSaveKeys() {
    if (!openaiKey.trim()) return;
    setSaveStatus('saving');
    saveKeysMutation.mutate({ openaiApiKey: openaiKey.trim() });
  }

  const driveConnected = status?.googleDrive?.connected ?? false;
  const driveConfigured = status?.googleDrive?.configured ?? false;

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/profile" className="rounded-md p-1 text-muted hover:bg-card-border/50">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Link01 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">Integrations</h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <svg className="h-6 w-6" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                  <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                  <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-20.4 35.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                  <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 13.15z" fill="#ea4335"/>
                  <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                  <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                  <path d="m73.4 26.5-10.1-17.5c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 23.8h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Google Drive</h3>
                <p className="text-xs text-muted">Store photos, medical records, and journal PDFs on your Drive</p>
              </div>
            </div>
            {driveConnected ? (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
                <Check className="h-3 w-3" /> Connected
              </span>
            ) : (
              <span className="text-xs text-muted">Not connected</span>
            )}
          </div>

          {!driveConnected ? (
            <div className="mt-4">
              {!driveConfigured && (
                <div className="mb-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs text-warning">
                  Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file to enable this integration.
                </div>
              )}
              <button
                onClick={handleConnectGoogle}
                disabled={!driveConfigured}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                Connect Google Drive
              </button>
              <p className="mt-2 text-[10px] text-muted">
                This creates a &quot;HealthTracker&quot; folder on your Drive for photos, medical records, and journal PDFs.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-sidebar-bg px-3 py-2 text-xs">
                <span className="text-muted">Folder:</span>
                <code className="text-foreground font-mono">HealthTracker/</code>
              </div>
              <button
                onClick={() => { if (confirm('Disconnect Google Drive? API keys will be removed.')) disconnectMutation.mutate(); }}
                className="rounded-lg border border-danger/30 px-4 py-2 text-xs font-medium text-danger hover:bg-danger/5 transition-colors"
              >
                <XCircle className="inline h-3 w-3 mr-1" /> Disconnect
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <h3 className="text-sm font-semibold text-foreground mb-1">API Keys</h3>
          <p className="text-xs text-muted mb-4">
            Keys are encrypted and stored securely. Used for AI-powered food analysis.
          </p>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-foreground">OpenAI API Key</label>
                {profile?.hasOpenaiKey && (
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Active</span>
                )}
              </div>
              {profile?.hasOpenaiKey && profile?.openaiApiKeyMasked && (
                <div className="flex items-center gap-2 mb-2 rounded-lg bg-sidebar-bg px-3 py-2">
                  <code className="flex-1 text-xs text-muted font-mono">{profile.openaiApiKeyMasked}</code>
                  <button onClick={async () => {
                    try {
                      await apiClient('/api/v1/profile', { method: 'PUT', body: { openaiApiKey: '' } });
                      queryClient.invalidateQueries({ queryKey: ['profile'] });
                      setSaveStatus('saved');
                    } catch { setSaveStatus('error'); }
                  }} className="rounded px-2 py-0.5 text-[10px] font-medium text-danger hover:bg-danger/10">
                    Remove
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={openaiKey}
                  onChange={(e) => setOpenaiKey(e.target.value)}
                  placeholder={profile?.hasOpenaiKey ? 'Enter new key to replace...' : 'sk-proj-...'}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 pr-24 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button onClick={() => setShowKey(!showKey)} className="p-1.5 text-muted hover:text-foreground">
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  {openaiKey.trim() && (
                    <button onClick={handleSaveKeys} disabled={saveStatus === 'saving'}
                      className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-white hover:bg-primary-dark disabled:opacity-50">
                      Save
                    </button>
                  )}
                </div>
              </div>
              {saveStatus === 'saved' && <p className="mt-1 text-xs text-success flex items-center gap-1"><Check className="h-3 w-3" /> Saved</p>}
              {saveStatus === 'error' && <p className="mt-1 text-xs text-danger flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Failed to save</p>}
              <p className="mt-1 text-[10px] text-muted">Powers AI food analysis for nutrition tracking.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
