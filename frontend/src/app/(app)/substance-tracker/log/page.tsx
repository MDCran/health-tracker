'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Check,
} from '@untitled-ui/icons-react';
import { substanceApi } from '@/lib/api/substance';
import { SUBSTANCE_TYPES } from '@/types/substance';

const MOOD_OPTIONS = [
  { value: 1, label: 'Terrible', emoji: '1' },
  { value: 2, label: 'Bad', emoji: '2' },
  { value: 3, label: 'Okay', emoji: '3' },
  { value: 4, label: 'Good', emoji: '4' },
  { value: 5, label: 'Great', emoji: '5' },
];

export default function LogSubstancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: customTypes } = useQuery({
    queryKey: ['substance-custom-types'],
    queryFn: () => substanceApi.customTypes(),
  });

  const allTypes = [
    ...SUBSTANCE_TYPES,
    ...(customTypes ?? []).map((ct) => ({ value: ct.key, label: ct.name, icon: 'circle', color: ct.color })),
  ];

  const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
  const [substanceType, setSubstanceType] = useState<string>('ALCOHOL');
  const [occurredAt, setOccurredAt] = useState(now);
  const [amount, setAmount] = useState('');
  const [context, setContext] = useState('');
  const [moodBefore, setMoodBefore] = useState<number | null>(null);
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => substanceApi.log(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['substance-stats-all'] });
      router.push('/substance-tracker');
    },
  });

  const handleSave = () => {
    createMutation.mutate({
      substanceType,
      occurredAt: new Date(occurredAt).toISOString(),
      amount: amount.trim() || null,
      context: context.trim() || null,
      moodBefore,
      moodAfter,
      notes: notes.trim() || null,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <Link
        href="/substance-tracker"
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Tracker
      </Link>

      <h1 className="text-2xl font-bold text-foreground">Log Occurrence</h1>
      <p className="text-sm text-muted -mt-4">Record a substance use event. Honesty helps you track progress.</p>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">What?</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {allTypes.map((t) => (
            <button
              key={t.value}
              onClick={() => setSubstanceType(t.value)}
              className={`flex flex-col items-center gap-2 rounded-lg px-4 py-4 text-sm font-medium transition-all ${
                substanceType === t.value
                  ? 'ring-2 ring-offset-2 ring-offset-background text-foreground'
                  : 'border border-card-border bg-card-bg text-muted hover:border-primary/30 hover:text-foreground'
              }`}
              style={substanceType === t.value
                ? { borderColor: t.color, boxShadow: `0 0 0 2px ${t.color}`, backgroundColor: `${t.color}10` }
                : {}
              }
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${t.color}20` }}
              >
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: t.color }} />
              </div>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">When?</label>
        <input
          type="datetime-local"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Amount <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={
            substanceType === 'ALCOHOL'
              ? 'e.g., 3 beers, 2 glasses of wine'
              : substanceType === 'DRUG'
                ? 'e.g., 2 joints, 1 edible'
                : 'e.g., once'
          }
          className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Context <span className="text-muted font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="e.g., at a party, stressed at work, bored at home"
          className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Mood Before <span className="text-muted font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMoodBefore(moodBefore === opt.value ? null : opt.value)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                moodBefore === opt.value
                  ? 'bg-primary text-white'
                  : 'border border-card-border bg-card-bg text-muted hover:border-primary hover:text-primary'
              }`}
            >
              <span className="text-xs font-bold">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Mood After <span className="text-muted font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMoodAfter(moodAfter === opt.value ? null : opt.value)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                moodAfter === opt.value
                  ? 'bg-primary text-white'
                  : 'border border-card-border bg-card-bg text-muted hover:border-primary hover:text-primary'
              }`}
            >
              <span className="text-xs font-bold">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">
          Notes <span className="text-muted font-normal">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional thoughts, triggers, or reflections..."
          rows={4}
          className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-3 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {createMutation.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          Failed to save entry. Please try again.
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={createMutation.isPending}
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
            Log Occurrence
          </>
        )}
      </button>
    </div>
  );
}
