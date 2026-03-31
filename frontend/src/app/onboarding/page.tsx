'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowRight, ArrowLeft, Eye, EyeOff, AlertCircle } from '@untitled-ui/icons-react';
import { useAuthStore } from '@/lib/stores/auth';
import { profileApi } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';
import { ACTIVITY_LEVELS, DIET_GOALS } from '@/types/profile';
import { LogoMark } from '@/components/Logo';

const STEPS = [
  { label: 'Personal Info', icon: '1' },
  { label: 'Google Drive', icon: '2' },
  { label: 'AI Setup', icon: '3' },
  { label: 'Body Stats', icon: '4' },
  { label: 'Complete', icon: '5' },
];

interface IntegrationStatus {
  googleDrive: { configured: boolean; connected: boolean; folderId: string };
}


function ProgressPipeline({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center gap-0 w-full max-w-md mx-auto mb-10">
      {STEPS.map((s, i) => {
        const done = i < currentStep;
        const active = i === currentStep;
        return (
          <div key={s.label} className="flex items-center flex-1 last:flex-none">
            <div className="relative flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-500 ${
                  done
                    ? 'bg-primary text-white scale-100'
                    : active
                      ? 'bg-primary text-white scale-110 ring-4 ring-primary/20'
                      : 'bg-card-border text-muted scale-100'
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : s.icon}
              </div>
              <span
                className={`absolute -bottom-6 whitespace-nowrap text-[10px] font-medium transition-colors duration-300 ${
                  done || active ? 'text-primary' : 'text-muted-light'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="relative flex-1 h-0.5 mx-1.5">
                <div className="absolute inset-0 bg-card-border rounded-full" />
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-700 ease-out"
                  style={{ width: done ? '100%' : active ? '50%' : '0%' }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


function StepCard({ children, title, subtitle }: { children: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div
      className="rounded-2xl border border-card-border bg-card-bg p-8 shadow-sm animate-fade-in"
      style={{ boxShadow: 'var(--shadow-md)' }}
    >
      <h2 className="text-xl font-bold text-foreground mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-muted mb-6">{subtitle}</p>}
      {!subtitle && <div className="mb-6" />}
      {children}
    </div>
  );
}


export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const [driveConnected, setDriveConnected] = useState(false);
  const [driveConfigured, setDriveConfigured] = useState(false);
  const [checkingDrive, setCheckingDrive] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [openaiKey, setOpenaiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [keySaving, setKeySaving] = useState(false);

  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [activityLevel, setActivityLevel] = useState('MODERATE');
  const [dietGoal, setDietGoal] = useState('MAINTAIN');

  useEffect(() => {
    apiClient<IntegrationStatus>('/api/v1/integrations/status')
      .then((s) => { setDriveConnected(s.googleDrive.connected); setDriveConfigured(s.googleDrive.configured); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 1 && !driveConnected) {
      pollRef.current = setInterval(() => {
        apiClient<IntegrationStatus>('/api/v1/integrations/status')
          .then((s) => { if (s.googleDrive.connected) { setDriveConnected(true); if (pollRef.current) clearInterval(pollRef.current); } })
          .catch(() => {});
      }, 2000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [step, driveConnected]);

  useEffect(() => {
    function handleMessage(e: MessageEvent) { if (e.data === 'google-drive-connected') setDriveConnected(true); }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  function handleConnectGoogle() {
    setCheckingDrive(true);
    apiClient<{ url: string }>('/api/v1/integrations/google/auth-url')
      .then((d) => window.open(d.url, 'google-oauth', 'width=600,height=700'))
      .catch(() => alert('Google OAuth is not configured on this server.'))
      .finally(() => setCheckingDrive(false));
  }

  async function handleSaveApiKey() {
    if (!openaiKey.trim()) return;
    setKeySaving(true);
    try {
      await apiClient('/api/v1/integrations/google/save-keys', { method: 'POST', body: { openaiApiKey: openaiKey.trim() } });
      setKeySaved(true);
    } catch {}
    finally { setKeySaving(false); }
  }

  const canProceed = useCallback(() => {
    if (step === 0) return firstName.trim() && lastName.trim();
    return true;
  }, [step, firstName, lastName]);

  const handleNext = useCallback(async () => {
    if (!canProceed()) return;
    if (step === 2 && openaiKey.trim() && !keySaved) {
      try {
        await profileApi.update({ openaiApiKey: openaiKey.trim() });
        setKeySaved(true);
      } catch {}
    }
    if (step < 4) { setStep(step + 1); return; }
    setSaving(true);
    try {
      const data: Record<string, unknown> = { firstName: firstName.trim(), lastName: lastName.trim(), unitSystem: 'IMPERIAL' };
      if (dob) data.dateOfBirth = dob;
      if (gender) data.gender = gender;
      if (heightFeet || heightInches) {
        const totalInches = (parseFloat(heightFeet) || 0) * 12 + (parseFloat(heightInches) || 0);
        data.heightCm = Math.round(totalInches * 2.54 * 100) / 100;
      }
      if (weightLbs) data.weightKg = Math.round((parseFloat(weightLbs) / 2.20462) * 100) / 100;
      if (activityLevel) data.activityLevel = activityLevel;
      if (dietGoal) data.dietGoal = dietGoal;
      const profile = await profileApi.update(data);
      setUser(profile);
      router.push('/dashboard');
    } catch { setSaving(false); }
  }, [step, canProceed, firstName, lastName, dob, gender, heightFeet, heightInches, weightLbs, activityLevel, dietGoal, openaiKey, keySaved, setUser, router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter' && canProceed()) handleNext();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canProceed, handleNext]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8">
          <LogoMark size="lg" />
        </div>

        <ProgressPipeline currentStep={step} />

        <div className="mt-10">
          {step === 0 && (
            <StepCard title="Welcome" subtitle="Let's start with your name.">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">First Name</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} autoFocus
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="John" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Last Name</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                    className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Doe" />
                </div>
              </div>
            </StepCard>
          )}

          {step === 1 && (
            <StepCard title="Connect Google Drive" subtitle="Optional — needed for storing progress photos, medical records, and journal PDFs on your personal Drive. You can connect later in Settings.">
              {driveConnected ? (
                <div className="rounded-xl border border-success/30 bg-success/5 p-6 text-center animate-fade-in-scale">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                  <p className="text-sm font-semibold text-success">Google Drive connected</p>
                  <p className="mt-1 text-xs text-muted">A HealthTracker folder was created on your Drive.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {!driveConfigured && (
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs text-warning flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Google OAuth is not configured. Contact the administrator.</span>
                    </div>
                  )}
                  <div className="rounded-xl border border-card-border bg-sidebar-bg p-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <svg className="h-8 w-8" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
                        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
                        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-20.4 35.3c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
                        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 13.15z" fill="#ea4335"/>
                        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
                        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
                        <path d="m73.4 26.5-10.1-17.5c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 23.8h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
                      </svg>
                    </div>
                    <button onClick={handleConnectGoogle} disabled={!driveConfigured || checkingDrive}
                      className="rounded-xl bg-[#4285f4] px-8 py-3 text-sm font-semibold text-white hover:bg-[#3367d6] disabled:opacity-50 transition-all active:scale-[0.98]">
                      {checkingDrive ? 'Opening...' : 'Sign in with Google'}
                    </button>
                    <p className="mt-3 text-[10px] text-muted">We only request access to files created by this app.</p>
                  </div>
                </div>
              )}
            </StepCard>
          )}

          {step === 2 && (
            <StepCard title="AI-Powered Nutrition" subtitle="Add your OpenAI key to enable photo-based food analysis. You can skip this and add it later.">
              {keySaved ? (
                <div className="rounded-xl border border-success/30 bg-success/5 p-4 text-center animate-fade-in-scale">
                  <Check className="mx-auto h-5 w-5 text-success mb-1" />
                  <p className="text-sm font-medium text-success">Key saved to your Google Drive</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input type={showKey ? 'text' : 'password'} value={openaiKey} onChange={e => setOpenaiKey(e.target.value)}
                      placeholder="sk-proj-..." autoFocus
                      className="w-full rounded-xl border border-card-border bg-background px-4 py-3 pr-12 text-sm font-mono text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-foreground">
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-muted">
                    Your key will be encrypted and saved to Google Drive when you click Continue.
                    Get one at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener" className="text-primary hover:underline">platform.openai.com</a>
                  </p>
                </div>
              )}
            </StepCard>
          )}

          {step === 3 && (
            <StepCard title="Body Stats" subtitle="Optional — helps us calculate BMR, TDEE, and nutrition targets.">
              <div className="grid grid-cols-2 gap-x-4 gap-y-5">
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1.5 block text-xs font-medium text-muted">Date of Birth</label>
                  <div className="relative">
                    <input type="date" value={dob} onChange={e => setDob(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-card-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="mb-1.5 block text-xs font-medium text-muted">Gender</label>
                  <div className="relative">
                    <select value={gender} onChange={e => setGender(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-card-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                      <option value="">Select...</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Height</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input type="number" value={heightFeet} onChange={e => setHeightFeet(e.target.value)} placeholder="5"
                        className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">ft</span>
                    </div>
                    <div className="relative flex-1">
                      <input type="number" value={heightInches} onChange={e => setHeightInches(e.target.value)} placeholder="10"
                        className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">in</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Weight</label>
                  <div className="relative">
                    <input type="number" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} placeholder="160"
                      className="w-full rounded-xl border border-card-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">lbs</span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Activity Level</label>
                  <div className="relative">
                    <select value={activityLevel} onChange={e => setActivityLevel(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-card-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                      {ACTIVITY_LEVELS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Diet Goal</label>
                  <div className="relative">
                    <select value={dietGoal} onChange={e => setDietGoal(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-card-border bg-background px-4 py-2.5 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                      {DIET_GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>
              </div>
            </StepCard>
          )}

          {step === 4 && (
            <StepCard title="You're all set" subtitle="Your Health Tracker is ready to go.">
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10 animate-fade-in-scale">
                  <Check className="h-8 w-8 text-success" />
                </div>
                <p className="text-sm text-muted">
                  Welcome, <span className="font-semibold text-foreground">{firstName}</span>. Start tracking your health.
                </p>
              </div>
            </StepCard>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          {step > 0 && step < 4 ? (
            <button onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 rounded-xl border border-card-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground hover:bg-sidebar-bg transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : <div />}

          <button onClick={handleNext} disabled={!canProceed() || saving}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-all active:scale-[0.98]">
            {saving ? 'Saving...' : step === 4 ? 'Go to Dashboard' : step === 2 ? (openaiKey.trim() ? 'Next' : 'Skip') : 'Continue'}
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-light">
          Step {step + 1} of {STEPS.length} {step === 2 && '(optional)'} {step === 3 && '(optional)'}
        </p>
      </div>
    </div>
  );
}
