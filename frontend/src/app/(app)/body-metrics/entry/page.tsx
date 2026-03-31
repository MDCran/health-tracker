'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metricsApi } from '@/lib/api/metrics';
import { profileApi } from '@/lib/api/auth';
import type { MetricType } from '@/types/metrics';
import { MEASUREMENT_GROUPS, METRIC_LABELS, METRIC_UNITS } from '@/types/metrics';
import { ArrowLeft, AlertCircle, InfoCircle, Lock01 } from '@untitled-ui/icons-react';
import { differenceInYears, parseISO } from 'date-fns';

type UnitSystem = 'METRIC' | 'IMPERIAL';
type GroupName = keyof typeof MEASUREMENT_GROUPS;

const AUTO_CALCULATED: MetricType[] = ['BMI', 'BODY_FAT', 'FAT_FREE_WEIGHT', 'MUSCLE_MASS', 'BONE_MASS', 'BODY_WATER', 'SKELETAL_MUSCLE', 'PROTEIN_PCT', 'BMR', 'METABOLIC_AGE', 'SUBCUTANEOUS_FAT', 'VISCERAL_FAT', 'WAIST_HIP_RATIO', 'CHEST_HIP_RATIO', 'WAIST_CHEST_RATIO'];
const RATIO_METRICS: MetricType[] = ['WAIST_HIP_RATIO', 'CHEST_HIP_RATIO', 'WAIST_CHEST_RATIO'];

function getImperialUnit(metric: string): string {
  const metricUnit = METRIC_UNITS[metric] || '';
  if (metricUnit === 'kg') return 'lbs';
  if (metricUnit === 'in') return 'in';
  return metricUnit;
}

function getDisplayUnit(metric: string, system: UnitSystem): string {
  if (system === 'IMPERIAL') return getImperialUnit(metric);
  return METRIC_UNITS[metric] || '';
}

function toMetricValue(value: number, metric: string, system: UnitSystem): number {
  if (system === 'METRIC') return value;
  const metricUnit = METRIC_UNITS[metric] || '';
  if (metricUnit === 'kg') return value * 0.453592;
  return value;
}

export default function BodyMetricsEntryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [unitSystem, setUnitSystem] = useState<UnitSystem>('IMPERIAL');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  });

  useEffect(() => {
    if (profile?.unitSystem) {
      setUnitSystem(profile.unitSystem as UnitSystem);
    }
  }, [profile?.unitSystem]);

  const profileMissing = !profile?.heightCm || !profile?.dateOfBirth || !profile?.gender;

  const age = useMemo(() => {
    if (!profile?.dateOfBirth) return null;
    try {
      return differenceInYears(new Date(), parseISO(profile.dateOfBirth));
    } catch {
      return null;
    }
  }, [profile?.dateOfBirth]);

  function updateValue(key: string, val: string) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  const calculated = useMemo(() => {
    const weight = values.WEIGHT ? Number(values.WEIGHT) : null;
    const waist = values.WAIST ? Number(values.WAIST) : null;
    const neck = values.NECK ? Number(values.NECK) : null;
    const hips = values.HIPS ? Number(values.HIPS) : null;
    const chest = values.CHEST ? Number(values.CHEST) : null;

    const weightKg = weight
      ? unitSystem === 'IMPERIAL' ? weight * 0.453592 : weight
      : null;
    const heightCm = profile?.heightCm ?? null;
    const isMale = profile?.gender === 'MALE' || profile?.gender === 'male';

    let bmi: number | null = null;
    if (weightKg && heightCm) {
      bmi = weightKg / ((heightCm / 100) ** 2);
    }

    let bodyFat: number | null = null;
    if (waist && neck && heightCm) {
      const waistCm = unitSystem === 'IMPERIAL' ? waist * 2.54 : waist;
      const neckCm = unitSystem === 'IMPERIAL' ? neck * 2.54 : neck;
      const hipsCm = hips ? (unitSystem === 'IMPERIAL' ? hips * 2.54 : hips) : null;

      if (isMale) {
        bodyFat = 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
      } else if (hipsCm) {
        bodyFat = 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipsCm - neckCm) + 0.22100 * Math.log10(heightCm)) - 450;
      }
      if (bodyFat !== null) bodyFat = Math.max(2, Math.min(60, bodyFat));
    }

    let fatFreeWeight: number | null = null;
    if (weight && bodyFat) {
      fatFreeWeight = weight * (1 - bodyFat / 100);
    }

    let muscleMass: number | null = null;
    if (fatFreeWeight) {
      muscleMass = fatFreeWeight * 0.43;
    }

    let boneMass: number | null = null;
    if (fatFreeWeight) {
      boneMass = fatFreeWeight * 0.15;
    }

    let bodyWater: number | null = null;
    if (weight && bodyFat) {
      const leanMass = weight * (1 - bodyFat / 100);
      bodyWater = (leanMass * (isMale ? 0.73 : 0.70) / weight) * 100;
    }

    let skeletalMuscle: number | null = null;
    if (muscleMass && weight) {
      skeletalMuscle = (muscleMass / weight) * 100;
    }

    let proteinPct: number | null = null;
    if (fatFreeWeight && weight) {
      proteinPct = (fatFreeWeight * 0.16 / weight) * 100;
    }

    let bmr: number | null = null;
    if (weightKg && heightCm && age) {
      const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
      bmr = isMale ? base + 5 : base - 161;
    }

    let metabolicAge: number | null = null;
    if (bmr && age) {
      const baseBmr = isMale ? 1800 : 1400;
      const declinePerYear = 10;
      metabolicAge = Math.round(25 + (baseBmr - bmr) / declinePerYear);
      metabolicAge = Math.max(15, Math.min(80, metabolicAge));
    }

    let subcutaneousFat: number | null = null;
    if (bodyFat) {
      subcutaneousFat = bodyFat * 0.80;
    }

    let visceralFat: number | null = null;
    if (waist && heightCm) {
      const waistCm = unitSystem === 'IMPERIAL' ? waist * 2.54 : waist;
      const waistHeightRatio = waistCm / heightCm;
      let base = (waistHeightRatio - 0.3) * 50;
      if (age) base += (age - 30) * 0.15;
      if (!isMale) base *= 0.8;
      visceralFat = Math.max(1, Math.min(30, Math.round(base)));
    }

    let waistHipRatio: number | null = null;
    if (waist && hips) waistHipRatio = waist / hips;
    let chestHipRatio: number | null = null;
    if (chest && hips) chestHipRatio = chest / hips;
    let waistChestRatio: number | null = null;
    if (waist && chest) waistChestRatio = waist / chest;

    return {
      BMI: bmi,
      BODY_FAT: bodyFat,
      FAT_FREE_WEIGHT: fatFreeWeight,
      MUSCLE_MASS: muscleMass,
      BONE_MASS: boneMass,
      BODY_WATER: bodyWater,
      SKELETAL_MUSCLE: skeletalMuscle,
      PROTEIN_PCT: proteinPct,
      BMR: bmr,
      METABOLIC_AGE: metabolicAge,
      SUBCUTANEOUS_FAT: subcutaneousFat,
      VISCERAL_FAT: visceralFat,
      WAIST_HIP_RATIO: waistHipRatio,
      CHEST_HIP_RATIO: chestHipRatio,
      WAIST_CHEST_RATIO: waistChestRatio,
    };
  }, [values, unitSystem, profile, age]);

  const createMetric = useMutation({
    mutationFn: (data: Record<string, unknown>) => metricsApi.create(data),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);

    const entries: { metricType: MetricType; value: number; unit: string; customName?: string }[] = [];

    const allMetrics = Object.values(MEASUREMENT_GROUPS).flat() as string[];
    for (const metric of allMetrics) {
      if (AUTO_CALCULATED.includes(metric as MetricType)) continue;

      const raw = values[metric];
      if (raw && Number(raw) > 0) {
        const numericValue = Number(raw);
        const storedValue = toMetricValue(numericValue, metric, unitSystem);
        const storedUnit = METRIC_UNITS[metric] || '';

        entries.push({
          metricType: metric as MetricType,
          value: Math.round(storedValue * 100) / 100,
          unit: storedUnit,
          ...(metric === 'CUSTOM' && customName ? { customName } : {}),
        });
      }
    }

    for (const [key, val] of Object.entries(calculated)) {
      if (val !== null && !isNaN(val)) {
        const metricKey = key as MetricType;
        let storedValue = Math.round(val * 100) / 100;
        const storedUnit = METRIC_UNITS[metricKey] || '';

        if (metricKey === 'FAT_FREE_WEIGHT' && unitSystem === 'IMPERIAL') {
          storedValue = Math.round(val * 0.453592 * 100) / 100;
        }

        entries.push({
          metricType: metricKey,
          value: storedValue,
          unit: storedUnit,
        });
      }
    }

    if (entries.length === 0) {
      setError('Please enter at least one measurement');
      setSaving(false);
      return;
    }

    try {
      await Promise.all(
        entries.map((entry) =>
          createMetric.mutateAsync({
            metricType: entry.metricType,
            value: entry.value,
            unit: entry.unit,
            measuredAt: new Date(date).toISOString(),
            notes: null,
            ...(entry.customName ? { customName: entry.customName } : {}),
          }),
        ),
      );
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['metric-trend'] });
      queryClient.invalidateQueries({ queryKey: ['metrics-latest'] });
      router.push('/body-metrics');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save measurements',
      );
    } finally {
      setSaving(false);
    }
  }

  function isAutoCalculated(metric: string): boolean {
    return AUTO_CALCULATED.includes(metric as MetricType);
  }

  function getCalculatedDisplay(metric: string): string {
    const val = calculated[metric as keyof typeof calculated];
    if (val === null || val === undefined) return '--';
    return val.toFixed(RATIO_METRICS.includes(metric as MetricType) ? 3 : 1);
  }

  function renderField(metric: string) {
    const label = METRIC_LABELS[metric] || metric;
    const displayUnit = getDisplayUnit(metric, unitSystem);
    const autoCalc = isAutoCalculated(metric);

    if (autoCalc) {
      const display = getCalculatedDisplay(metric);
      return (
        <div key={metric}>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
            {label}
            <Lock01 className="h-3 w-3 text-muted" />
          </label>
          <div className="relative">
            <input
              type="text"
              readOnly
              value={display !== '--' ? display : ''}
              placeholder="Auto"
              className="w-full rounded-lg border border-card-border bg-sidebar-bg px-3 py-2 pr-12 text-sm text-muted outline-none cursor-not-allowed"
            />
            {displayUnit && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
                {displayUnit}
              </span>
            )}
          </div>
          {metric === 'BMI' && !profile?.heightCm && (
            <p className="mt-1 text-xs text-muted">Requires height in profile</p>
          )}
          {metric === 'BMR' && (!profile?.heightCm || !age || !profile?.gender) && (
            <p className="mt-1 text-xs text-muted">Requires height, DOB, and gender in profile</p>
          )}
          {metric === 'FAT_FREE_WEIGHT' && (
            <p className="mt-1 text-xs text-muted">Calculated from weight and body fat %</p>
          )}
        </div>
      );
    }

    if (metric === 'CUSTOM') {
      return (
        <div key={metric} className="col-span-full">
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            Custom Measurement
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Measurement name"
              />
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={values[metric] || ''}
                onChange={(e) => updateValue(metric, e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 pr-12 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={metric}>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="relative">
          <input
            type="number"
            step="any"
            value={values[metric] || ''}
            onChange={(e) => updateValue(metric, e.target.value)}
            className="w-full rounded-lg border border-card-border bg-background px-3 py-2 pr-12 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            placeholder="0"
          />
          {displayUnit && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">
              {displayUnit}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/body-metrics"
          className="rounded-md p-1.5 text-muted hover:bg-card-border/50 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">
          New Measurement
        </h1>
      </div>

      {profileMissing && (
        <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <InfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Set your height, date of birth, and gender in your{' '}
              <Link href="/profile/settings" className="font-medium underline">
                profile
              </Link>{' '}
              for accurate BMI and BMR calculations.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="rounded-xl border border-card-border bg-card-bg p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Units
              </label>
              <div className="flex gap-1 rounded-lg border border-card-border bg-background p-1">
                <button
                  type="button"
                  onClick={() => setUnitSystem('METRIC')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    unitSystem === 'METRIC'
                      ? 'bg-primary text-white'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Metric
                </button>
                <button
                  type="button"
                  onClick={() => setUnitSystem('IMPERIAL')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    unitSystem === 'IMPERIAL'
                      ? 'bg-primary text-white'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  Imperial
                </button>
              </div>
            </div>
          </div>
        </div>

        {(Object.entries(MEASUREMENT_GROUPS) as [GroupName, readonly string[]][]).map(
          ([groupName, metrics]) => {
            const isRatioGroup = groupName === 'Ratios';

            return (
              <div
                key={groupName}
                className="rounded-xl border border-card-border bg-card-bg p-4"
              >
                <h3 className="mb-4 text-sm font-semibold text-foreground">
                  {groupName}
                </h3>
                {isRatioGroup && (
                  <p className="mb-4 text-xs text-muted">
                    These values are auto-calculated from your waist, hips, and chest measurements above.
                  </p>
                )}
                <div
                  className={`grid gap-4 ${
                    metrics.length === 1
                      ? 'grid-cols-1 sm:max-w-xs'
                      : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
                  {metrics.map((metric) => renderField(metric))}
                </div>
              </div>
            );
          },
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/body-metrics"
            className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Measurements'}
          </button>
        </div>
      </form>
    </div>
  );
}
