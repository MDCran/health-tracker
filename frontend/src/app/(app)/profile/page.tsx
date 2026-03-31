'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/lib/api/auth';
import { nutritionApi } from '@/lib/api/nutrition';
import { useAuthStore } from '@/lib/stores/auth';
import type { UserProfile } from '@/types/profile';
import type { NutritionGoal } from '@/types/nutrition';
import { ACTIVITY_LEVELS, DIET_GOALS } from '@/types/profile';
import {
  User01,
  Check,
  AlertCircle,
  Activity,
  Target04,
  Lightning01,
  Camera01,
  Edit05,
  RefreshCcw01,
} from '@untitled-ui/icons-react';

type UnitSystem = 'METRIC' | 'IMPERIAL';

function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalIn = cm / 2.54;
  const feet = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return { feet, inches };
}

function feetInchesToCm(feet: number, inches: number): number {
  return (feet * 12 + inches) * 2.54;
}

function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462);
}

function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 100) / 100;
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const { setUser } = useAuthStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [heightCm, setHeightCm] = useState('');
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [weightLbs, setWeightLbs] = useState('');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('METRIC');
  const [activityLevel, setActivityLevel] = useState<string | null>(null);
  const [dietGoal, setDietGoal] = useState<string | null>(null);
  const [weeklyChange, setWeeklyChange] = useState('0');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitializedRef = useRef(false);

  const [showCustomTargets, setShowCustomTargets] = useState(false);
  const [hasCustomTargets, setHasCustomTargets] = useState(false);
  const [customCalories, setCustomCalories] = useState('');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFat, setCustomFat] = useState('');
  const [customFiber, setCustomFiber] = useState('');
  const [goalsSaveStatus, setGoalsSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const { data: nutritionGoals } = useQuery<NutritionGoal>({
    queryKey: ['nutritionGoals'],
    queryFn: () => nutritionApi.getGoals(),
  });

  useEffect(() => {
    if (nutritionGoals) {
      const hasGoals = nutritionGoals.calories != null || nutritionGoals.proteinG != null
        || nutritionGoals.carbsG != null || nutritionGoals.fatG != null || nutritionGoals.fiberG != null;
      setHasCustomTargets(hasGoals);
      if (hasGoals) {
        setCustomCalories(nutritionGoals.calories?.toString() || '');
        setCustomProtein(nutritionGoals.proteinG?.toString() || '');
        setCustomCarbs(nutritionGoals.carbsG?.toString() || '');
        setCustomFat(nutritionGoals.fatG?.toString() || '');
        setCustomFiber(nutritionGoals.fiberG?.toString() || '');
      }
    }
  }, [nutritionGoals]);

  const saveCustomGoals = useMutation({
    mutationFn: (data: NutritionGoal) => nutritionApi.setGoals(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['nutritionGoals'], updated);
      setHasCustomTargets(true);
      setShowCustomTargets(false);
      setGoalsSaveStatus('saved');
      setTimeout(() => setGoalsSaveStatus('idle'), 2000);
    },
    onError: () => {
      setGoalsSaveStatus('error');
      setTimeout(() => setGoalsSaveStatus('idle'), 3000);
    },
  });

  const resetGoals = useMutation({
    mutationFn: () => nutritionApi.setGoals({ calories: null, proteinG: null, carbsG: null, fatG: null, fiberG: null }),
    onSuccess: () => {
      queryClient.setQueryData(['nutritionGoals'], { calories: null, proteinG: null, carbsG: null, fatG: null, fiberG: null });
      setHasCustomTargets(false);
      setShowCustomTargets(false);
      setCustomCalories('');
      setCustomProtein('');
      setCustomCarbs('');
      setCustomFat('');
      setCustomFiber('');
      setGoalsSaveStatus('saved');
      setTimeout(() => setGoalsSaveStatus('idle'), 2000);
    },
    onError: () => {
      setGoalsSaveStatus('error');
      setTimeout(() => setGoalsSaveStatus('idle'), 3000);
    },
  });

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setDateOfBirth(profile.dateOfBirth || '');
      setGender(profile.gender || null);
      setActivityLevel(profile.activityLevel || null);
      setDietGoal(profile.dietGoal || null);
      setWeeklyChange(profile.targetWeeklyChangeKg?.toString() || '0');

      const sys = (profile.unitSystem as UnitSystem) || 'METRIC';
      setUnitSystem(sys);

      if (profile.heightCm != null) {
        setHeightCm(String(profile.heightCm));
        const { feet, inches } = cmToFeetInches(profile.heightCm);
        setHeightFeet(String(feet));
        setHeightInches(String(inches));
      }
      if (profile.weightKg != null) {
        setWeightKg(String(profile.weightKg));
        setWeightLbs(String(kgToLbs(profile.weightKg)));
      }

      setTimeout(() => {
        isInitializedRef.current = true;
      }, 100);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: (data: Partial<UserProfile>) => profileApi.update(data),
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

  const uploadAvatar = useMutation({
    mutationFn: (file: File) => profileApi.uploadAvatar(file),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
      setUser(updated);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
  });

  const buildPayload = useCallback((): Record<string, unknown> => {
    let finalHeightCm: number | null = null;
    let finalWeightKg: number | null = null;

    if (unitSystem === 'METRIC') {
      finalHeightCm = heightCm ? Number(heightCm) : null;
      finalWeightKg = weightKg ? Number(weightKg) : null;
    } else {
      if (heightFeet || heightInches) {
        finalHeightCm = Math.round(
          feetInchesToCm(Number(heightFeet || 0), Number(heightInches || 0))
        );
      }
      if (weightLbs) {
        finalWeightKg = lbsToKg(Number(weightLbs));
      }
    }

    return {
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      dateOfBirth: dateOfBirth || null,
      gender,
      heightCm: finalHeightCm,
      weightKg: finalWeightKg,
      unitSystem,
      activityLevel,
      dietGoal,
      targetWeeklyChangeKg: parseFloat(weeklyChange) || 0,
    };
  }, [firstName, lastName, dateOfBirth, gender, heightCm, heightFeet, heightInches, weightKg, weightLbs, unitSystem, activityLevel, dietGoal, weeklyChange]);

  const triggerAutoSave = useCallback(() => {
    if (!isInitializedRef.current) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(() => {
      updateProfile.mutate(buildPayload() as Partial<UserProfile>);
    }, 400);
  }, [buildPayload]);

  useEffect(() => {
    triggerAutoSave();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [firstName, lastName, dateOfBirth, gender, heightCm, heightFeet, heightInches, weightKg, weightLbs, unitSystem, activityLevel, dietGoal, weeklyChange]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar.mutate(file);
  };

  function handleUnitToggle(sys: UnitSystem) {
    setUnitSystem(sys);
    if (sys === 'IMPERIAL' && heightCm) {
      const { feet, inches } = cmToFeetInches(Number(heightCm));
      setHeightFeet(String(feet));
      setHeightInches(String(inches));
    }
    if (sys === 'METRIC' && heightFeet) {
      setHeightCm(
        String(Math.round(feetInchesToCm(Number(heightFeet), Number(heightInches || 0))))
      );
    }
    if (sys === 'IMPERIAL' && weightKg) {
      setWeightLbs(String(kgToLbs(Number(weightKg))));
    }
    if (sys === 'METRIC' && weightLbs) {
      setWeightKg(String(lbsToKg(Number(weightLbs))));
    }
  }

  const missingFields = !gender || !heightCm || !dateOfBirth;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-card-border bg-card-bg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
        <div className="relative group">
          {profile?.hasAvatar ? (
            <img
              src={profileApi.avatarUrl()}
              alt="Avatar"
              className="h-16 w-16 rounded-full object-cover ring-2 ring-card-border"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold ring-2 ring-card-border">
              {(profile?.firstName || profile?.username || '?').charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <Camera01 className="h-5 w-5" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          {uploadAvatar.isPending && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">
            {[profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Profile'}
          </h1>
          {profile?.username && (
            <p className="text-sm text-muted">@{profile.username}</p>
          )}
        </div>
        <a href="/profile/integrations" className="text-xs font-medium text-primary hover:underline whitespace-nowrap border-l border-card-border pl-4">
          Manage Integrations
        </a>
        </div>
        <div className="flex items-center gap-1.5 h-6">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-xs text-muted animate-pulse">
              <div className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-muted border-t-transparent" />
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-xs text-success">
              <Check className="h-3.5 w-3.5" />
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-xs text-danger">
              <AlertCircle className="h-3.5 w-3.5" />
              Failed to save
            </span>
          )}
        </div>
      </div>

      <div className="space-y-6">

        {missingFields && (
          <div className="flex items-start gap-3 rounded-lg border border-info/20 bg-info/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-info" />
            <div>
              <p className="text-sm font-medium text-info">
                Complete your profile for personalized targets
              </p>
              <p className="mt-1 text-xs text-info/70">
                Fill in your{' '}
                {[
                  !gender && 'gender',
                  !heightCm && !heightFeet && 'height',
                  !dateOfBirth && 'date of birth',
                ]
                  .filter(Boolean)
                  .join(', ')}{' '}
                to calculate BMR, TDEE, and recommended nutrition targets.
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-card-border bg-card-bg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
            Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Last name"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Date of Birth
            </label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:max-w-xs"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Gender
            </label>
            <div className="flex gap-3">
              {(['MALE', 'FEMALE'] as const).map((g) => (
                <label
                  key={g}
                  className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    gender === g
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-card-border text-muted hover:border-muted-light'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="sr-only"
                  />
                  {g === 'MALE' ? 'Male' : 'Female'}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Body
            </h3>
            <div className="inline-flex rounded-lg border border-card-border bg-background p-0.5">
              <button
                type="button"
                onClick={() => handleUnitToggle('METRIC')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  unitSystem === 'METRIC'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Metric
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('IMPERIAL')}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                  unitSystem === 'IMPERIAL'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                Imperial
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Height
              </label>
              {unitSystem === 'METRIC' ? (
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                    cm
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      value={heightFeet}
                      onChange={(e) => setHeightFeet(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="5"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                      ft
                    </span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      max="11"
                      value={heightInches}
                      onChange={(e) => setHeightInches(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 pr-8 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="10"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                      in
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Weight
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={unitSystem === 'METRIC' ? weightKg : weightLbs}
                  onChange={(e) => {
                    if (unitSystem === 'METRIC') {
                      setWeightKg(e.target.value);
                    } else {
                      setWeightLbs(e.target.value);
                    }
                  }}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                  {unitSystem === 'METRIC' ? 'kg' : 'lbs'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-5 space-y-5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              Fitness Goals
            </h3>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Activity Level
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ACTIVITY_LEVELS.map((lvl) => (
                <label
                  key={lvl.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
                    activityLevel === lvl.value
                      ? 'border-primary bg-primary/5'
                      : 'border-card-border hover:border-muted-light'
                  }`}
                >
                  <input
                    type="radio"
                    name="activityLevel"
                    value={lvl.value}
                    checked={activityLevel === lvl.value}
                    onChange={() => setActivityLevel(lvl.value)}
                    className="sr-only"
                  />
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      activityLevel === lvl.value
                        ? 'border-primary bg-primary'
                        : 'border-card-border'
                    }`}
                  >
                    {activityLevel === lvl.value && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        activityLevel === lvl.value ? 'text-primary' : 'text-foreground'
                      }`}
                    >
                      {lvl.label}
                    </p>
                    <p className="text-xs text-muted">{lvl.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-foreground">
              Diet Goal
            </label>
            <div className="grid grid-cols-3 gap-3">
              {DIET_GOALS.map((goal) => {
                const isSelected = dietGoal === goal.value;
                const borderColors: Record<string, string> = {
                  CUT: isSelected
                    ? 'border-red-500 bg-red-500/5'
                    : 'border-card-border hover:border-red-300',
                  MAINTAIN: isSelected
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-card-border hover:border-blue-300',
                  BULK: isSelected
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-card-border hover:border-green-300',
                };
                const iconColors: Record<string, string> = {
                  CUT: 'text-red-500',
                  MAINTAIN: 'text-blue-500',
                  BULK: 'text-green-500',
                };
                return (
                  <label
                    key={goal.value}
                    className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-3 py-5 text-center transition-colors ${borderColors[goal.value]}`}
                  >
                    <input
                      type="radio"
                      name="dietGoal"
                      value={goal.value}
                      checked={isSelected}
                      onChange={() => setDietGoal(goal.value)}
                      className="sr-only"
                    />
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isSelected ? 'bg-current/10' : 'bg-sidebar-bg'
                      }`}
                    >
                      {goal.value === 'CUT' && (
                        <Target04 className={`h-5 w-5 ${iconColors[goal.value]}`} />
                      )}
                      {goal.value === 'MAINTAIN' && (
                        <Activity className={`h-5 w-5 ${iconColors[goal.value]}`} />
                      )}
                      {goal.value === 'BULK' && (
                        <Lightning01 className={`h-5 w-5 ${iconColors[goal.value]}`} />
                      )}
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        isSelected ? iconColors[goal.value] : 'text-foreground'
                      }`}
                    >
                      {goal.label}
                    </p>
                    <p className="text-[11px] leading-tight text-muted">{goal.desc}</p>
                  </label>
                );
              })}
            </div>
          </div>
          {dietGoal && dietGoal !== 'MAINTAIN' && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-foreground mb-2">
                {dietGoal === 'CUT' ? 'Target Weight Loss' : 'Target Weight Gain'} per Week
              </label>
              <div className="flex flex-wrap gap-2">
                {(dietGoal === 'CUT'
                  ? [
                      { label: '0.25 lb', value: -0.11 },
                      { label: '0.5 lb', value: -0.23 },
                      { label: '1 lb', value: -0.45 },
                      { label: '1.5 lb', value: -0.68 },
                      { label: '2 lb', value: -0.91 },
                    ]
                  : [
                      { label: '0.25 lb', value: 0.11 },
                      { label: '0.5 lb', value: 0.23 },
                      { label: '1 lb', value: 0.45 },
                    ]
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setWeeklyChange(opt.value.toString())}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      Math.abs(parseFloat(weeklyChange) - opt.value) < 0.02
                        ? 'bg-primary text-white'
                        : 'border border-card-border text-muted hover:border-primary'
                    }`}
                  >
                    {opt.label}/wk
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {dietGoal === 'CUT'
                  ? 'A safe rate is 0.5-1 lb/week. Faster rates may cause muscle loss.'
                  : 'A lean bulk targets 0.25-0.5 lb/week to minimize fat gain.'}
              </p>
            </div>
          )}
        </div>

        {(() => {
          const w = unitSystem === 'IMPERIAL' ? (parseFloat(weightLbs) || 0) * 0.453592 : parseFloat(weightKg) || 0;
          const h = parseFloat(heightCm) || (unitSystem === 'IMPERIAL' ? (parseFloat(heightFeet) || 0) * 30.48 + (parseFloat(heightInches) || 0) * 2.54 : 0);
          const a = dateOfBirth ? Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / 31557600000) : 0;
          const isMale = gender === 'MALE';
          if (!w || !h || !a || !gender) return null;

          const bmrVal = 10 * w + 6.25 * h - 5 * a + (isMale ? 5 : -161);
          const mult = { SEDENTARY: 1.2, LIGHT: 1.375, MODERATE: 1.55, ACTIVE: 1.725, VERY_ACTIVE: 1.9 }[activityLevel || 'MODERATE'] || 1.55;
          const tdeeVal = bmrVal * mult;

          const wc = parseFloat(weeklyChange) || 0;
          let dailyAdj = 0;
          if (Math.abs(wc) > 0.01) {
            dailyAdj = wc * 7700 / 7;
          } else {
            dailyAdj = dietGoal === 'CUT' ? tdeeVal * -0.2 : dietGoal === 'BULK' ? tdeeVal * 0.15 : 0;
          }
          const targetCals = Math.max(1200, tdeeVal + dailyAdj);
          const pp = dietGoal === 'CUT' ? 0.4 : dietGoal === 'BULK' ? 0.3 : 0.3;
          const cp = dietGoal === 'CUT' ? 0.3 : dietGoal === 'BULK' ? 0.45 : 0.4;
          const fp = dietGoal === 'CUT' ? 0.3 : dietGoal === 'BULK' ? 0.25 : 0.3;

          const recCalories = Math.round(targetCals);
          const recProtein = Math.round(targetCals * pp / 4);
          const recCarbs = Math.round(targetCals * cp / 4);
          const recFat = Math.round(targetCals * fp / 9);
          const recFiber = 28;

          return (
            <>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Lightning01 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  Recommended Targets
                </h3>
                {hasCustomTargets && (
                  <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600">
                    Custom
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-card-border bg-card-bg p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">BMR</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{Math.round(bmrVal)}</p>
                  <p className="text-xs text-muted">kcal/day at rest</p>
                </div>
                <div className="rounded-lg border border-card-border bg-card-bg p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">TDEE</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{Math.round(tdeeVal)}</p>
                  <p className="text-xs text-muted">kcal/day total</p>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  {hasCustomTargets ? 'Active Daily Targets' : 'Recommended Daily Targets'}
                  {dietGoal && dietGoal !== 'MAINTAIN' && !hasCustomTargets && (
                    <span className={`ml-2 ${dietGoal === 'CUT' ? 'text-danger' : 'text-success'}`}>
                      ({dietGoal === 'CUT' ? 'Cutting' : 'Bulking'}{Math.abs(wc) > 0.01 ? ` @ ${Math.abs(Math.round(wc * 2.205 * 10) / 10)} lb/wk` : ''})
                    </span>
                  )}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Calories', value: hasCustomTargets && nutritionGoals?.calories != null ? nutritionGoals.calories : recCalories, unit: 'kcal', color: 'text-foreground' },
                    { label: 'Protein', value: hasCustomTargets && nutritionGoals?.proteinG != null ? nutritionGoals.proteinG : recProtein, unit: 'grams', color: 'text-red-500' },
                    { label: 'Carbs', value: hasCustomTargets && nutritionGoals?.carbsG != null ? nutritionGoals.carbsG : recCarbs, unit: 'grams', color: 'text-blue-500' },
                    { label: 'Fat', value: hasCustomTargets && nutritionGoals?.fatG != null ? nutritionGoals.fatG : recFat, unit: 'grams', color: 'text-amber-500' },
                    { label: 'Fiber', value: hasCustomTargets && nutritionGoals?.fiberG != null ? nutritionGoals.fiberG : recFiber, unit: 'grams', color: 'text-emerald-500' },
                  ].map((t) => (
                    <div key={t.label} className="rounded-lg border border-card-border bg-card-bg p-3 text-center">
                      <p className="text-xs text-muted">{t.label}</p>
                      <p className={`mt-1 text-lg font-bold tabular-nums ${t.color}`}>{t.value}</p>
                      <p className="text-[10px] text-muted">{t.unit}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-primary/10 pt-4 space-y-3">
                {!showCustomTargets ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!hasCustomTargets) {
                          setCustomCalories(recCalories.toString());
                          setCustomProtein(recProtein.toString());
                          setCustomCarbs(recCarbs.toString());
                          setCustomFat(recFat.toString());
                          setCustomFiber(recFiber.toString());
                        }
                        setShowCustomTargets(true);
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-card-border bg-card-bg px-3 py-2 text-xs font-medium text-foreground hover:border-primary transition-colors"
                    >
                      <Edit05 className="h-3.5 w-3.5" />
                      Customize Targets
                    </button>
                    {hasCustomTargets && (
                      <button
                        type="button"
                        onClick={() => resetGoals.mutate()}
                        disabled={resetGoals.isPending}
                        className="flex items-center gap-1.5 rounded-lg border border-card-border bg-card-bg px-3 py-2 text-xs font-medium text-muted hover:border-danger hover:text-danger transition-colors disabled:opacity-50"
                      >
                        <RefreshCcw01 className={`h-3.5 w-3.5 ${resetGoals.isPending ? 'animate-spin' : ''}`} />
                        Reset to Recommended
                      </button>
                    )}
                    {goalsSaveStatus === 'saved' && (
                      <span className="flex items-center gap-1 text-xs text-success">
                        <Check className="h-3.5 w-3.5" />
                        Saved
                      </span>
                    )}
                    {goalsSaveStatus === 'error' && (
                      <span className="flex items-center gap-1 text-xs text-danger">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Failed
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-foreground">Set Custom Targets</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { label: 'Calories', value: customCalories, setter: setCustomCalories, unit: 'kcal' },
                        { label: 'Protein', value: customProtein, setter: setCustomProtein, unit: 'g' },
                        { label: 'Carbs', value: customCarbs, setter: setCustomCarbs, unit: 'g' },
                        { label: 'Fat', value: customFat, setter: setCustomFat, unit: 'g' },
                        { label: 'Fiber', value: customFiber, setter: setCustomFiber, unit: 'g' },
                      ].map((field) => (
                        <div key={field.label}>
                          <label className="mb-1 block text-[11px] font-medium text-muted">{field.label}</label>
                          <div className="relative">
                            <input
                              type="number"
                              step="1"
                              min="0"
                              value={field.value}
                              onChange={(e) => field.setter(e.target.value)}
                              className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 pr-10 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted">
                              {field.unit}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setGoalsSaveStatus('saving');
                          saveCustomGoals.mutate({
                            calories: customCalories ? parseInt(customCalories) : null,
                            proteinG: customProtein ? parseInt(customProtein) : null,
                            carbsG: customCarbs ? parseInt(customCarbs) : null,
                            fatG: customFat ? parseInt(customFat) : null,
                            fiberG: customFiber ? parseInt(customFiber) : null,
                          });
                        }}
                        disabled={saveCustomGoals.isPending}
                        className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
                      >
                        {saveCustomGoals.isPending ? 'Saving...' : 'Save Custom Targets'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCustomTargets(false)}
                        className="rounded-lg border border-card-border px-4 py-2 text-xs font-medium text-muted hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-xs leading-relaxed text-muted">
                These recommendations are calculated estimates based on standard formulas (Mifflin-St Jeor for BMR, activity multipliers for TDEE). They are not medical advice. Consult a healthcare professional before making significant dietary changes.
              </p>
            </div>
            </>
          );
        })()}

      </div>

      <DeleteAccountSection />

      <ExportDataSection />
    </div>
  );
}

const EXPORT_SECTIONS: Record<string, string> = {
  WORKOUTS: 'Workouts & PRs',
  HABITS: 'Habits',
  NUTRITION: 'Nutrition & Macros',
  SLEEP: 'Sleep',
  THERAPEUTICS: 'Therapeutics',
  VITALS: 'Vitals',
  BODY_METRICS: 'Body Metrics',
  APPOINTMENTS: 'Appointments',
  MEDICAL_RECORDS: 'Medical Records',
  SOBER_TRACKER: 'Sober Tracker',
  JOURNAL: 'Journal',
};

function ExportDataSection() {
  const [showExport, setShowExport] = useState(false);
  const [sections, setSections] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(EXPORT_SECTIONS).map(k => [k, true]))
  );
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(false);

  const selected = Object.entries(sections).filter(([, v]) => v).map(([k]) => k);

  async function handleExport() {
    if (selected.length === 0) return;
    setExporting(true);
    try {
      const { exportPdf } = await import('@/lib/api/export');
      await exportPdf(selected, from, to);
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Export Data</h2>
          <p className="text-xs text-muted mt-0.5">Download a comprehensive PDF report</p>
        </div>
        <button onClick={() => setShowExport(!showExport)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors">
          Export PDF
        </button>
      </div>
      {showExport && (
        <div className="mt-4 space-y-4 border-t border-card-border pt-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted mb-2">Include in report:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(EXPORT_SECTIONS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer rounded-lg border border-card-border px-3 py-2 hover:bg-sidebar-bg transition-colors">
                  <input type="checkbox" checked={sections[key] ?? false}
                    onChange={(e) => setSections(p => ({ ...p, [key]: e.target.checked }))}
                    className="rounded border-card-border text-primary focus:ring-primary" />
                  <span className="text-xs font-medium text-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleExport} disabled={exporting || selected.length === 0}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {exporting ? 'Generating...' : `Download PDF (${selected.length} sections)`}
            </button>
            <button onClick={() => setSections(Object.fromEntries(Object.keys(EXPORT_SECTIONS).map(k => [k, true])))}
              className="text-xs text-primary hover:underline">All</button>
            <button onClick={() => setSections(Object.fromEntries(Object.keys(EXPORT_SECTIONS).map(k => [k, false])))}
              className="text-xs text-muted hover:underline">None</button>
          </div>
        </div>
      )}
    </div>
  );
}

function DeleteAccountSection() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  return (
    <div className="rounded-xl border border-danger/30 bg-danger/5 p-5 space-y-3">
      <h3 className="text-sm font-semibold text-danger uppercase tracking-wide">Danger Zone</h3>
      <p className="text-xs text-muted">Permanently delete your account and all associated data. This action cannot be undone.</p>
      {!showConfirm ? (
        <button onClick={() => setShowConfirm(true)}
          className="rounded-lg border-2 border-red-600 bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 hover:border-red-700 transition-colors shadow-sm shadow-red-600/20">
          Delete Account
        </button>
      ) : (
        <div className="space-y-3 rounded-lg border border-danger/30 bg-background p-4">
          <p className="text-xs text-foreground font-medium">Type <span className="font-bold text-danger">DELETE</span> to confirm:</p>
          <input type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)}
            placeholder="Type DELETE" autoFocus
            className="w-full rounded-lg border border-danger/30 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-danger focus:ring-2 focus:ring-danger/20" />
          <div className="flex gap-2">
            <button onClick={() => {
              if (confirmText !== 'DELETE') return;
              setDeleting(true);
              profileApi.deleteAccount().then(() => {
                useAuthStore.getState().logout();
                window.location.href = '/';
              }).catch(() => setDeleting(false));
            }} disabled={confirmText !== 'DELETE' || deleting}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
              {deleting ? 'Deleting...' : 'Permanently Delete'}
            </button>
            <button onClick={() => { setShowConfirm(false); setConfirmText(''); }}
              className="rounded-lg border border-card-border px-4 py-2 text-sm text-muted hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
