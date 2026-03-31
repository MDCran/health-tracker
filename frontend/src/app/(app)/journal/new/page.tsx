'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Check,
  Star01,
} from '@untitled-ui/icons-react';
import { journalApi } from '@/lib/api/journal';
import { REALMS } from '@/types/journal';
import type { WellnessRealm } from '@/types/journal';

interface RealmState {
  rating: number;
  likertResponse: number;
  notes: string;
}

const LIKERT_LABELS = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [realmStates, setRealmStates] = useState<Record<WellnessRealm, RealmState>>(
    () => {
      const init: Record<string, RealmState> = {};
      REALMS.forEach((r) => {
        init[r.key] = { rating: 0, likertResponse: 0, notes: '' };
      });
      return init as Record<WellnessRealm, RealmState>;
    }
  );
  const [reflection, setReflection] = useState('');
  const [gratitude, setGratitude] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => journalApi.create(data),
    onSuccess: () => {
      router.push('/journal');
    },
  });

  const updateRealm = (realm: WellnessRealm, field: keyof RealmState, value: number | string) => {
    setRealmStates((prev) => ({
      ...prev,
      [realm]: { ...prev[realm], [field]: value },
    }));
  };

  const overallRating = (() => {
    const rated = REALMS.filter((r) => realmStates[r.key].rating > 0);
    if (rated.length === 0) return 0;
    const avg = rated.reduce((sum, r) => sum + realmStates[r.key].rating, 0) / rated.length;
    return Math.round(avg / 2);
  })();

  const handleSave = () => {
    const realmRatings = REALMS
      .filter((r) => realmStates[r.key].rating > 0)
      .map((r) => ({
        realm: r.key,
        rating: realmStates[r.key].rating,
        likertResponses: realmStates[r.key].likertResponse > 0
          ? { satisfaction: realmStates[r.key].likertResponse }
          : null,
        notes: realmStates[r.key].notes.trim() || null,
      }));

    createMutation.mutate({
      date,
      reflection: reflection.trim() || null,
      gratitude: gratitude.trim() || null,
      overallRating: overallRating > 0 ? overallRating : null,
      realmRatings,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <Link href="/journal" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Journal
      </Link>

      <h1 className="text-2xl font-bold text-foreground">New Journal Entry</h1>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Wellness Realms</h2>
        {REALMS.map((realm) => {
          const state = realmStates[realm.key];
          return (
            <div
              key={realm.key}
              className="rounded-lg border border-card-border bg-card-bg overflow-hidden"
            >
              <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border" style={{ borderLeftWidth: '3px', borderLeftColor: realm.color }}>
                <span className="text-lg font-semibold text-foreground">{realm.label}</span>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-2">
                    Rating (1-10)
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((val) => (
                      <button
                        key={val}
                        onClick={() => updateRealm(realm.key, 'rating', state.rating === val ? 0 : val)}
                        className={`h-8 w-8 rounded-full text-xs font-bold transition-all ${
                          val <= state.rating
                            ? 'text-white scale-105'
                            : 'bg-sidebar-bg text-muted hover:bg-card-border'
                        }`}
                        style={val <= state.rating ? { backgroundColor: realm.color } : {}}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-2">
                    &quot;How satisfied are you with your {realm.label.toLowerCase()} life?&quot;
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LIKERT_LABELS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateRealm(realm.key, 'likertResponse', state.likertResponse === opt.value ? 0 : opt.value)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                          state.likertResponse === opt.value
                            ? 'bg-primary text-white'
                            : 'border border-card-border bg-card-bg text-muted hover:border-primary hover:text-primary'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Notes (optional)</label>
                  <textarea
                    value={state.notes}
                    onChange={(e) => updateRealm(realm.key, 'notes', e.target.value)}
                    placeholder={`Thoughts on your ${realm.label.toLowerCase()} wellness...`}
                    rows={2}
                    className="w-full rounded-md border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {overallRating > 0 && (
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <p className="text-sm text-muted mb-1">Overall Rating (auto-calculated)</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star01
                key={i}
                className={`h-6 w-6 ${i <= overallRating ? 'text-warning fill-warning' : 'text-muted-light/30'}`}
              />
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Reflection</label>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="How was your day? What's on your mind?"
          rows={6}
          className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-3 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Gratitude</label>
        <textarea
          value={gratitude}
          onChange={(e) => setGratitude(e.target.value)}
          placeholder="What are you grateful for today?"
          rows={3}
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
            Save Entry
          </>
        )}
      </button>
    </div>
  );
}
