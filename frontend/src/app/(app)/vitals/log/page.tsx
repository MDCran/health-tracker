'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Check, Plus } from '@untitled-ui/icons-react';
import { vitalsApi, VITAL_TYPES } from '@/lib/api/vitals';

export default function LogVitalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [vitalType, setVitalType] = useState<(typeof VITAL_TYPES)[number]['key'] | ''>(VITAL_TYPES[0].key);
  const [value, setValue] = useState('');
  const [value2, setValue2] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(new Date(), 'HH:mm'));
  const [notes, setNotes] = useState('');

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [customHasValue2, setCustomHasValue2] = useState(false);
  const [customV2Label, setCustomV2Label] = useState('');
  const [customVitals, setCustomVitals] = useState<typeof VITAL_TYPES[number][]>([]);

  const allVitals = [...VITAL_TYPES, ...customVitals];
  const selectedVital = allVitals.find(v => v.key === vitalType) ?? VITAL_TYPES[0];

  function addCustomVital() {
    if (!customName.trim()) return;
    const key = 'CUSTOM_' + customName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const newVital = {
      key,
      label: customName.trim(),
      unit: customUnit.trim() || '',
      hasValue2: customHasValue2,
      ...(customHasValue2 ? { v1Label: 'Value 1', v2Label: customV2Label.trim() || 'Value 2' } : {}),
    } as typeof VITAL_TYPES[number];
    setCustomVitals(prev => [...prev, newVital]);
    setVitalType(key as typeof vitalType);
    setShowCustomForm(false);
    setCustomName('');
    setCustomUnit('');
    setCustomHasValue2(false);
    setCustomV2Label('');
  }

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => vitalsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vitals'] });
      setValue('');
      setValue2('');
      setNotes('');
    },
  });

  function handleSave() {
    if (!value) return;
    createMutation.mutate({
      vitalType,
      value: Number(value),
      value2: selectedVital.hasValue2 && value2 ? Number(value2) : null,
      unit: selectedVital.unit,
      measuredAt: new Date(`${date}T${time}`).toISOString(),
      notes: notes.trim() || null,
    });
  }

  function handleDone() {
    router.push('/vitals');
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 pb-8">
      <Link href="/vitals" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Vitals
      </Link>

      <h1 className="text-2xl font-bold text-foreground">Log Vitals</h1>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Vital Type</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {allVitals.map((v) => (
            <button key={v.key} onClick={() => { setVitalType(v.key); setValue(''); setValue2(''); }}
              className={`rounded-lg px-3 py-2.5 text-xs font-medium transition-all text-left ${
                vitalType === v.key
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'border border-card-border text-muted hover:border-primary/30'
              }`}>
              {v.label}
            </button>
          ))}
          <button onClick={() => { setShowCustomForm(!showCustomForm); if (!showCustomForm) { setVitalType(''); setValue(''); setValue2(''); } }}
            className="rounded-lg border-2 border-dashed border-card-border px-3 py-2.5 text-xs font-medium text-muted hover:border-primary/30 hover:text-primary transition-all flex items-center justify-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Custom
          </button>
        </div>

        {showCustomForm && (
          <div className="mt-3 rounded-xl border border-card-border bg-sidebar-bg p-4 space-y-3 animate-fade-in">
            <p className="text-xs font-semibold text-foreground">Create Custom Vital</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[10px] font-medium text-muted">Name</label>
                <input type="text" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="e.g., Testosterone"
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-medium text-muted">Unit</label>
                <input type="text" value={customUnit} onChange={e => setCustomUnit(e.target.value)} placeholder="e.g., ng/dL"
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
              <input type="checkbox" checked={customHasValue2} onChange={e => setCustomHasValue2(e.target.checked)}
                className="rounded border-card-border text-primary focus:ring-primary" />
              Has a second value (e.g., systolic/diastolic)
            </label>
            {customHasValue2 && (
              <input type="text" value={customV2Label} onChange={e => setCustomV2Label(e.target.value)} placeholder="Second value label"
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary" />
            )}
            <div className="flex gap-2">
              <button onClick={addCustomVital} disabled={!customName.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
                Add Vital Type
              </button>
              <button onClick={() => setShowCustomForm(false)}
                className="rounded-lg border border-card-border px-4 py-2 text-xs text-muted hover:text-foreground transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {vitalType && <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {selectedVital.hasValue2 ? selectedVital.v1Label : 'Value'}
          </label>
          <div className="relative">
            <input type="number" step="any" value={value} onChange={(e) => setValue(e.target.value)}
              placeholder="0" autoFocus
              className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 pr-16 text-lg font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{selectedVital.unit}</span>
          </div>
        </div>
        {selectedVital.hasValue2 && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{selectedVital.v2Label}</label>
            <div className="relative">
              <input type="number" step="any" value={value2} onChange={(e) => setValue2(e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 pr-16 text-lg font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary tabular-nums" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{selectedVital.unit}</span>
            </div>
          </div>
        )}
      </div>}

      <div className="flex gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Time</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Notes <span className="text-muted font-normal">(optional)</span></label>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., after exercise, fasting, etc."
          className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none" />
      </div>

      {createMutation.isSuccess && (
        <div className="rounded-lg border border-success/30 bg-success/5 px-4 py-2.5 text-sm text-success flex items-center gap-2">
          <Check className="h-4 w-4" /> Saved! Enter another reading or click Done.
        </div>
      )}

      {createMutation.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 px-4 py-2.5 text-sm text-danger">
          Failed to save. Please try again.
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={!value || createMutation.isPending}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
          {createMutation.isPending ? 'Saving...' : 'Save Reading'}
        </button>
        <button onClick={handleDone}
          className="rounded-lg border border-card-border px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground transition-colors">
          Done
        </button>
      </div>
    </div>
  );
}
