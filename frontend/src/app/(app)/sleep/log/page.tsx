'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import {
  ArrowLeft,
  Check,
  Plus,
  Trash01,
} from '@untitled-ui/icons-react';
import { sleepApi } from '@/lib/api/sleep';

interface InterruptionInput {
  wokeAt: string;
  fellBackAt: string;
  reason: string;
}

const RESTED_LABELS = [
  { value: 1, label: 'Very Tired', emoji: '😫' },
  { value: 2, label: 'Tired', emoji: '😴' },
  { value: 3, label: 'Okay', emoji: '😐' },
  { value: 4, label: 'Rested', emoji: '😊' },
  { value: 5, label: 'Very Rested', emoji: '😁' },
];

const SURVEY_QUESTIONS = [
  { key: 'didDream', label: 'Did you dream?', type: 'yesno' as const },
  { key: 'electronicsBeforeBed', label: 'Did you use electronics before bed?', type: 'yesno' as const },
  { key: 'caffeineAfter2pm', label: 'Did you consume caffeine after 2pm?', type: 'yesno' as const },
  { key: 'roomTempComfort', label: 'Room temperature comfort', type: 'scale5' as const },
  { key: 'stressLevel', label: 'Stress level before bed', type: 'scale5' as const },
];

export default function LogSleepPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
  const [date, setDate] = useState(dateParam || today);
  const [bedtime, setBedtime] = useState(`${yesterday}T22:30`);
  const [wakeTime, setWakeTime] = useState(`${today}T07:00`);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [feelRested, setFeelRested] = useState(3);
  const [sleepLatencyMin, setSleepLatencyMin] = useState(15);
  const [notes, setNotes] = useState('');
  const [surveyResponses, setSurveyResponses] = useState<Record<string, number>>({});
  const [interruptions, setInterruptions] = useState<InterruptionInput[]>([]);

  const calculatedDuration = useMemo(() => {
    try {
      const bed = new Date(bedtime);
      const wake = new Date(wakeTime);
      if (isNaN(bed.getTime()) || isNaN(wake.getTime())) return null;
      const mins = differenceInMinutes(wake, bed);
      if (mins <= 0) return null;
      const hours = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return { hours, minutes: remainingMins, totalMinutes: mins };
    } catch {
      return null;
    }
  }, [bedtime, wakeTime]);

  const updateSurvey = useCallback((key: string, value: number) => {
    setSurveyResponses((prev) => ({
      ...prev,
      [key]: prev[key] === value ? 0 : value,
    }));
  }, []);

  const addInterruption = useCallback(() => {
    setInterruptions((prev) => [...prev, { wokeAt: '', fellBackAt: '', reason: '' }]);
  }, []);

  const removeInterruption = useCallback((index: number) => {
    setInterruptions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateInterruption = useCallback((index: number, field: keyof InterruptionInput, value: string) => {
    setInterruptions((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }, []);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => sleepApi.create(data),
    onSuccess: () => {
      router.push('/sleep');
    },
  });

  const handleSave = () => {
    const bedInstant = new Date(bedtime).toISOString();
    const wakeInstant = new Date(wakeTime).toISOString();

    const filteredSurvey = Object.fromEntries(
      Object.entries(surveyResponses).filter(([, v]) => v > 0)
    );

    const interruptionPayloads = interruptions
      .filter((i) => i.wokeAt)
      .map((i) => ({
        wokeAt: new Date(`${date}T${i.wokeAt}`).toISOString(),
        fellBackAt: i.fellBackAt ? new Date(`${date}T${i.fellBackAt}`).toISOString() : null,
        reason: i.reason.trim() || null,
      }));

    createMutation.mutate({
      date,
      bedtime: bedInstant,
      wakeTime: wakeInstant,
      sleepQuality,
      feelRested,
      sleepLatencyMin,
      notes: notes.trim() || null,
      surveyResponses: Object.keys(filteredSurvey).length > 0 ? filteredSurvey : null,
      interruptions: interruptionPayloads.length > 0 ? interruptionPayloads : null,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <Link href="/sleep" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Sleep
      </Link>

      <h1 className="text-2xl font-bold text-foreground">Log Sleep</h1>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Bedtime</label>
          <input
            type="datetime-local"
            value={bedtime}
            onChange={(e) => setBedtime(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Wake Time</label>
          <input
            type="datetime-local"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {calculatedDuration && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-sm text-foreground">
            <span className="font-medium">Time in bed:</span>{' '}
            {calculatedDuration.hours}h {calculatedDuration.minutes}m
            <span className="text-muted ml-2">({calculatedDuration.totalMinutes} minutes)</span>
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Sleep Quality <span className="text-muted font-normal">({sleepQuality}/10)</span>
        </label>
        <div className="flex gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
            <button
              key={val}
              onClick={() => setSleepQuality(val)}
              className={`h-9 w-9 rounded-full text-xs font-bold transition-all ${
                val <= sleepQuality
                  ? 'bg-primary text-white scale-105'
                  : 'bg-sidebar-bg text-muted hover:bg-card-border'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">How Rested Do You Feel?</label>
        <div className="flex flex-wrap gap-2">
          {RESTED_LABELS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFeelRested(opt.value)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                feelRested === opt.value
                  ? 'bg-primary text-white'
                  : 'border border-card-border bg-card-bg text-muted hover:border-primary hover:text-primary'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Time to Fall Asleep <span className="text-muted font-normal">(minutes)</span>
        </label>
        <input
          type="number"
          min={0}
          max={180}
          value={sleepLatencyMin}
          onChange={(e) => setSleepLatencyMin(parseInt(e.target.value) || 0)}
          className="w-32 rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
        <div className="px-4 py-3 border-b border-card-border">
          <h3 className="text-sm font-semibold text-foreground">Sleep Survey</h3>
        </div>
        <div className="p-4 space-y-5">
          {SURVEY_QUESTIONS.map((q) => (
            <div key={q.key}>
              <label className="block text-sm font-medium text-foreground mb-2">{q.label}</label>
              {q.type === 'yesno' ? (
                <div className="flex gap-2">
                  {[
                    { value: 1, label: 'Yes' },
                    { value: 2, label: 'No' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateSurvey(q.key, opt.value)}
                      className={`rounded-lg px-5 py-1.5 text-sm font-medium transition-colors ${
                        surveyResponses[q.key] === opt.value
                          ? 'bg-primary text-white'
                          : 'border border-card-border bg-background text-muted hover:border-primary hover:text-primary'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => updateSurvey(q.key, val)}
                      className={`h-9 w-9 rounded-full text-xs font-bold transition-all ${
                        surveyResponses[q.key] === val
                          ? 'bg-primary text-white scale-105'
                          : val <= (surveyResponses[q.key] || 0)
                            ? 'bg-primary/20 text-primary'
                            : 'bg-sidebar-bg text-muted hover:bg-card-border'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
          <h3 className="text-sm font-semibold text-foreground">
            Night Interruptions
            {interruptions.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted">({interruptions.length})</span>
            )}
          </h3>
          <button
            onClick={addInterruption}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {interruptions.length === 0 && (
          <div className="px-4 py-6 text-center text-sm text-muted">
            No interruptions logged. Click &quot;Add&quot; if you woke up during the night.
          </div>
        )}

        {interruptions.map((item, index) => (
          <div key={index} className="border-b border-card-border last:border-b-0 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted">Interruption {index + 1}</p>
              <button
                onClick={() => removeInterruption(index)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-danger hover:bg-danger/10 transition-colors"
              >
                <Trash01 className="h-3 w-3" />
                Remove
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Woke at</label>
                <input
                  type="time"
                  value={item.wokeAt}
                  onChange={(e) => updateInterruption(index, 'wokeAt', e.target.value)}
                  className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Fell back at</label>
                <input
                  type="time"
                  value={item.fellBackAt}
                  onChange={(e) => updateInterruption(index, 'fellBackAt', e.target.value)}
                  className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Reason (optional)</label>
              <input
                type="text"
                value={item.reason}
                onChange={(e) => updateInterruption(index, 'reason', e.target.value)}
                placeholder="e.g., bathroom, noise, nightmare..."
                className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes about your sleep..."
          rows={4}
          className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-3 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {createMutation.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          Failed to save sleep entry. Please try again.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={createMutation.isPending || !calculatedDuration}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        {createMutation.isPending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Save Sleep Entry
          </>
        )}
      </button>
    </div>
  );
}
