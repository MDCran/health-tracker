'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { peptideApi, medicationApi, supplementApi, scheduleApi } from '@/lib/api/therapeutics';
import type { TherapeuticType } from '@/types/therapeutic';
import {
  ArrowLeft,
  Plus,
  Trash01,
} from '@untitled-ui/icons-react';
import Link from 'next/link';

type ScheduleType = 'DAILY' | 'SPECIFIC_DAYS' | 'INTERVAL';

const DAYS_OF_WEEK = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
  { label: 'Sun', value: 7 },
];

const DOSAGE_UNITS = ['mg', 'mcg', 'g', 'ml', 'IU', 'capsule', 'tablet', 'drop'];

interface Compound {
  compoundName: string;
  amountMg: number;
}

export default function NewTherapeuticPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [type, setType] = useState<TherapeuticType>('PEPTIDE');

  const [name, setName] = useState('');
  const [prescribedBy, setPrescribedBy] = useState('');
  const [notes, setNotes] = useState('');

  const [totalAmountMg, setTotalAmountMg] = useState('');
  const [bacWaterMl, setBacWaterMl] = useState('');
  const [compounds, setCompounds] = useState<Compound[]>([
    { compoundName: '', amountMg: 0 },
  ]);

  const [dosageAmount, setDosageAmount] = useState('');
  const [dosageUnit, setDosageUnit] = useState('mg');
  const [frequency, setFrequency] = useState('');

  const [scheduleType, setScheduleType] = useState<ScheduleType>('DAILY');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [intervalDays, setIntervalDays] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('');

  const [error, setError] = useState('');

  const createPeptide = useMutation({
    mutationFn: (data: Record<string, unknown>) => peptideApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['peptides'] }),
  });

  const createMedication = useMutation({
    mutationFn: (data: Record<string, unknown>) => medicationApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['medications'] }),
  });

  const createSupplement = useMutation({
    mutationFn: (data: Record<string, unknown>) => supplementApi.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['supplements'] }),
  });

  const createSchedule = useMutation({
    mutationFn: (data: Record<string, unknown>) => scheduleApi.create(data),
  });

  const isPending =
    createPeptide.isPending ||
    createMedication.isPending ||
    createSupplement.isPending;

  function addCompound() {
    setCompounds([...compounds, { compoundName: '', amountMg: 0 }]);
  }

  function removeCompound(index: number) {
    setCompounds(compounds.filter((_, i) => i !== index));
  }

  function updateCompound(index: number, field: keyof Compound, value: string | number) {
    const updated = [...compounds];
    if (field === 'compoundName') {
      updated[index] = { ...updated[index], compoundName: value as string };
    } else {
      updated[index] = { ...updated[index], amountMg: Number(value) || 0 };
    }
    setCompounds(updated);
  }

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      let createdId: number;

      if (type === 'PEPTIDE') {
        const result = await createPeptide.mutateAsync({
          name: name.trim(),
          totalAmountMg: Number(totalAmountMg) || 0,
          bacWaterMl: bacWaterMl ? Number(bacWaterMl) : null,
          compounds: compounds.filter((c) => c.compoundName.trim()),
          prescribedBy: prescribedBy.trim() || null,
          notes: notes.trim() || null,
        });
        createdId = result.id;
      } else if (type === 'MEDICATION') {
        const result = await createMedication.mutateAsync({
          name: name.trim(),
          dosageAmount: dosageAmount ? Number(dosageAmount) : null,
          dosageUnit: dosageUnit || null,
          frequency: frequency.trim() || null,
          prescribedBy: prescribedBy.trim() || null,
          notes: notes.trim() || null,
        });
        createdId = result.id;
      } else {
        const result = await createSupplement.mutateAsync({
          name: name.trim(),
          dosageAmount: dosageAmount ? Number(dosageAmount) : null,
          dosageUnit: dosageUnit || null,
          frequency: frequency.trim() || null,
          prescribedBy: prescribedBy.trim() || null,
          notes: notes.trim() || null,
        });
        createdId = result.id;
      }

      if (timeOfDay) {
        await createSchedule.mutateAsync({
          therapeuticType: type,
          therapeuticId: createdId,
          scheduleType,
          daysOfWeek: scheduleType === 'SPECIFIC_DAYS' ? selectedDays : [],
          intervalDays: scheduleType === 'INTERVAL' ? Number(intervalDays) || null : null,
          timeOfDay: timeOfDay || null,
          active: true,
          startDate: new Date().toISOString().split('T')[0],
        });
      }

      router.push('/therapeutics');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create therapeutic');
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/therapeutics"
          className="rounded-md p-1.5 text-muted hover:bg-card-border/50 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">New Therapeutic</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-card-border bg-card-bg p-4">
          <label className="mb-3 block text-sm font-medium text-foreground">
            Type
          </label>
          <div className="flex gap-3">
            {(
              [
                { value: 'PEPTIDE', label: 'Injectable', color: 'border-purple bg-purple/5 text-purple' },
                { value: 'MEDICATION', label: 'Medication', color: 'border-info bg-info/5 text-info' },
                { value: 'SUPPLEMENT', label: 'Supplement', color: 'border-success bg-success/5 text-success' },
              ] as const
            ).map((opt) => (
              <label
                key={opt.value}
                className={`flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors ${
                  type === opt.value
                    ? opt.color
                    : 'border-card-border text-muted hover:border-muted-light'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={opt.value}
                  checked={type === opt.value}
                  onChange={() => setType(opt.value)}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card-bg p-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g., BPC-157, Vitamin D3, Metformin"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Prescribed By <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={prescribedBy}
              onChange={(e) => setPrescribedBy(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="e.g., Dr. Smith"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Optional notes..."
            />
          </div>
        </div>

        {type === 'PEPTIDE' && (
          <div className="rounded-xl border border-card-border bg-card-bg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Peptide Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Total Amount (mg)
                </label>
                <input
                  type="number"
                  step="any"
                  value={totalAmountMg}
                  onChange={(e) => setTotalAmountMg(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., 5"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  BAC Water (ml)
                </label>
                <input
                  type="number"
                  step="any"
                  value={bacWaterMl}
                  onChange={(e) => setBacWaterMl(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., 2"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Compounds
                </label>
                <button
                  type="button"
                  onClick={addCompound}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary-dark"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Compound
                </button>
              </div>
              <div className="space-y-2">
                {compounds.map((compound, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={compound.compoundName}
                      onChange={(e) =>
                        updateCompound(idx, 'compoundName', e.target.value)
                      }
                      className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="Compound name"
                    />
                    <input
                      type="number"
                      step="any"
                      value={compound.amountMg || ''}
                      onChange={(e) =>
                        updateCompound(idx, 'amountMg', e.target.value)
                      }
                      className="w-28 rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      placeholder="mg"
                    />
                    {compounds.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCompound(idx)}
                        className="rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash01 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(type === 'MEDICATION' || type === 'SUPPLEMENT') && (
          <div className="rounded-xl border border-card-border bg-card-bg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              {type === 'MEDICATION' ? 'Medication' : 'Supplement'} Details
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Dosage Amount
                </label>
                <input
                  type="number"
                  step="any"
                  value={dosageAmount}
                  onChange={(e) => setDosageAmount(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., 500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Dosage Unit
                </label>
                <select
                  value={dosageUnit}
                  onChange={(e) => setDosageUnit(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                >
                  {DOSAGE_UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Frequency
                </label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Twice daily"
                />
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-card-border bg-card-bg p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Schedule</h3>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Schedule Type
            </label>
            <div className="flex gap-2">
              {(
                [
                  { value: 'DAILY', label: 'Daily' },
                  { value: 'SPECIFIC_DAYS', label: 'Specific Days' },
                  { value: 'INTERVAL', label: 'Interval' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setScheduleType(opt.value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                    scheduleType === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-card-border text-muted hover:border-muted-light'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {scheduleType === 'SPECIFIC_DAYS' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Days of Week
              </label>
              <div className="flex gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                      selectedDays.includes(day.value)
                        ? 'border-primary bg-primary text-white'
                        : 'border-card-border text-muted hover:border-muted-light'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scheduleType === 'INTERVAL' && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Every N Days
              </label>
              <input
                type="number"
                min="1"
                value={intervalDays}
                onChange={(e) => setIntervalDays(e.target.value)}
                className="w-32 rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g., 3"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              Time of Day
            </label>
            <input
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
              className="w-40 rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/therapeutics"
            className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
