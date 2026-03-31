'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, AlertCircle } from '@untitled-ui/icons-react';
import Link from 'next/link';
import { profileApi } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/stores/auth';
import { useThemeStore } from '@/lib/stores/theme';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  });

  const [unitSystem, setUnitSystem] = useState('IMPERIAL');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (profile) setUnitSystem(profile.unitSystem || 'IMPERIAL');
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data: Record<string, unknown>) => profileApi.update(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
      setUser(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    },
  });

  function handleUnitChange(unit: string) {
    setUnitSystem(unit);
    setSaveStatus('saving');
    updateProfile.mutate({ unitSystem: unit });
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/profile" className="rounded-md p-1 text-muted hover:bg-card-border/50">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
        </div>
        {saveStatus === 'saved' && (
          <span className="flex items-center gap-1.5 text-xs text-success"><Check className="h-3.5 w-3.5" /> Saved</span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1.5 text-xs text-danger"><AlertCircle className="h-3.5 w-3.5" /> Failed</span>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Units</h2>
          <div className="flex gap-2">
            <button
              onClick={() => handleUnitChange('IMPERIAL')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                unitSystem === 'IMPERIAL' ? 'bg-primary text-white' : 'border border-card-border text-muted hover:bg-card-border/50'
              }`}
            >
              Imperial
            </button>
            <button
              onClick={() => handleUnitChange('METRIC')}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                unitSystem === 'METRIC' ? 'bg-primary text-white' : 'border border-card-border text-muted hover:bg-card-border/50'
              }`}
            >
              Metric
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">Theme</h2>
          <div className="flex gap-2">
            <button
              onClick={() => { if (theme === 'dark') toggleTheme(); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                theme === 'light' ? 'bg-primary text-white' : 'border border-card-border text-muted hover:bg-card-border/50'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => { if (theme === 'light') toggleTheme(); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                theme === 'dark' ? 'bg-primary text-white' : 'border border-card-border text-muted hover:bg-card-border/50'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-6">
          <h2 className="mb-4 text-sm font-semibold text-foreground">About</h2>
          <p className="text-sm text-muted">Health Tracker v0.1</p>
          <p className="mt-1 text-sm text-muted-light">Built with Next.js, Spring Boot, and PostgreSQL</p>
        </div>
      </div>
    </div>
  );
}
