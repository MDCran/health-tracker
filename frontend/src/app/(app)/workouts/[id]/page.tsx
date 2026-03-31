'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock,
  Trophy01,
  Activity,
  BarChart01,
  Trash01,
  Edit01,
  Play,
} from '@untitled-ui/icons-react';
import { workoutApi } from '@/lib/api/workouts';
import { profileApi } from '@/lib/api/auth';
import type { WorkoutSession, WorkoutExercise } from '@/types/workout';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

function exerciseVolume(ex: WorkoutExercise): number {
  if (!ex.sets) return 0;
  return ex.sets.reduce((t, s) => t + ((s.weightKg ?? 0) * (s.reps ?? 0)), 0);
}

function totalVolume(session: WorkoutSession): number {
  if (!session.exercises) return 0;
  return session.exercises.reduce((t, ex) => t + exerciseVolume(ex), 0);
}

function totalSets(session: WorkoutSession): number {
  if (!session.exercises) return 0;
  return session.exercises.reduce((t, ex) => {
    if (!ex.sets) return t;
    return t + ex.sets.filter(s => s.completed).length;
  }, 0);
}

function cap(s: string | null | undefined): string {
  if (!s) return '';
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function LiveDuration({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const update = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <>{formatDuration(elapsed)}</>;
}

export default function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session, isLoading, error } = useQuery({
    queryKey: ['workout', id],
    queryFn: () => workoutApi.get(Number(id)),
  });
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileApi.get() });
  const isImperial = profile?.unitSystem === 'IMPERIAL';
  const wUnit = isImperial ? 'lbs' : 'kg';
  const toDisplay = (kg: number) => isImperial ? kg * 2.20462 : kg;

  const deleteMutation = useMutation({
    mutationFn: () => workoutApi.delete(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      router.push('/workouts');
    },
    onError: (err) => {
      alert('Failed to delete: ' + (err instanceof Error ? err.message : 'Unknown error'));
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="space-y-4">
        <Link href="/workouts" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Workouts
        </Link>
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-6">
          <p className="text-sm font-medium text-danger mb-3">Failed to load workout details.</p>
          <p className="text-xs text-muted mb-4">This workout may be incomplete or corrupted.</p>
          <button
            onClick={() => {
              if (confirm('Delete this workout permanently?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-danger/90 disabled:opacity-50 transition-colors"
          >
            <Trash01 className="h-4 w-4" />
            {deleteMutation.isPending ? 'Deleting...' : 'Delete This Workout'}
          </button>
        </div>
      </div>
    );
  }

  const vol = totalVolume(session);
  const sets = totalSets(session);

  return (
    <div className="space-y-6">
      <Link href="/workouts" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Workouts
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {session.name || 'Untitled Workout'}
          </h1>
          <p className="text-sm text-muted mt-1">
            {format(parseISO(session.date), 'EEEE, MMMM d, yyyy')}
          {session.startedAt && ` at ${format(parseISO(session.startedAt), 'h:mm a')}`}
        </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {!session.finishedAt && (
            <>
              <button
                onClick={() => router.push(`/workouts/new?resume=${id}`)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
              >
                <Play className="h-4 w-4" />
                Resume
              </button>
              <button
                onClick={() => {
                  workoutApi.finish(Number(id)).then(() => {
                    queryClient.invalidateQueries({ queryKey: ['workout', id] });
                    queryClient.invalidateQueries({ queryKey: ['workouts'] });
                  });
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/90 transition-colors"
              >
                End Workout
              </button>
            </>
          )}
          {session.finishedAt && (
            <button
              onClick={() => router.push(`/workouts/new?resume=${id}`)}
              className="inline-flex items-center gap-2 rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-foreground hover:bg-sidebar-bg transition-colors"
            >
              <Edit01 className="h-4 w-4" />
              Edit
            </button>
          )}
          <button
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
          >
            <Trash01 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <div className="flex items-center gap-2 text-muted mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Duration</span>
          </div>
          <p className="text-xl font-bold text-foreground">
            {session.durationSeconds
              ? formatDuration(session.durationSeconds)
              : session.startedAt && !session.finishedAt
                ? <LiveDuration startedAt={session.startedAt} />
                : '--'}
          </p>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <div className="flex items-center gap-2 text-muted mb-1">
            <BarChart01 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Volume</span>
          </div>
          <p className="text-xl font-bold text-foreground">{toDisplay(vol).toLocaleString(undefined, {maximumFractionDigits: 0})} {wUnit}</p>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <div className="flex items-center gap-2 text-muted mb-1">
            <Activity className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Exercises</span>
          </div>
          <p className="text-xl font-bold text-foreground">{session.exercises.length}</p>
        </div>
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <div className="flex items-center gap-2 text-muted mb-1">
            <Trophy01 className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Total Sets</span>
          </div>
          <p className="text-xl font-bold text-foreground">{sets}</p>
        </div>
      </div>

      {session.notes && (
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <h3 className="text-sm font-medium text-muted mb-2">Notes</h3>
          <p className="text-sm text-foreground whitespace-pre-wrap">{session.notes}</p>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Exercises</h2>
        {session.exercises
          .sort((a, b) => a.exerciseOrder - b.exerciseOrder)
          .map((ex) => (
            <div key={ex.id} className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
              <div className="flex items-center justify-between border-b border-card-border bg-sidebar-bg px-4 py-3">
                <div>
                  <h3 className="font-semibold text-foreground">{ex.exercise.name}</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ex.exercise.primaryMuscles.map((m) => (
                      <span key={m} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {m}
                      </span>
                    ))}
                    {ex.exercise.secondaryMuscles.map((m) => (
                      <span key={m} className="rounded-full bg-muted-light/15 px-2 py-0.5 text-xs text-muted">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right text-sm text-muted">
                  <p>Volume: <span className="font-mono font-medium text-foreground">{toDisplay(exerciseVolume(ex)).toLocaleString(undefined, {maximumFractionDigits: 0})} {wUnit}</span></p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border">
                      <th className="px-4 py-2 text-left font-medium text-muted w-16">Set</th>
                      <th className="px-4 py-2 text-right font-medium text-muted">Weight ({wUnit})</th>
                      <th className="px-4 py-2 text-right font-medium text-muted">Reps</th>
                      <th className="px-4 py-2 text-right font-medium text-muted">Volume</th>
                      <th className="px-4 py-2 text-center font-medium text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-card-border">
                    {ex.sets
                      .sort((a, b) => a.setNumber - b.setNumber)
                      .map((s) => {
                        const isPR = s.notes?.includes('PR');
                        return (
                          <tr key={s.id} className={isPR ? 'bg-warning/5' : ''}>
                            <td className="px-4 py-2 text-foreground font-medium">
                              {s.setNumber}
                              {s.setType !== 'WORKING' && (
                                <span className="ml-1 text-xs text-muted">({s.setType.toLowerCase()})</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-foreground">
                              {s.weightKg != null ? toDisplay(s.weightKg).toFixed(1) : '--'}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-foreground">
                              {s.reps ?? '--'}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-muted">
                              {(s.weightKg && s.reps) ? toDisplay(s.weightKg * s.reps).toLocaleString(undefined, {maximumFractionDigits: 0}) : '--'}
                            </td>
                            <td className="px-4 py-2 text-center">
                              {isPR ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-bold text-warning">
                                  <Trophy01 className="h-3 w-3" /> PR!
                                </span>
                              ) : s.completed ? (
                                <span className="inline-block h-2 w-2 rounded-full bg-success" />
                              ) : (
                                <span className="inline-block h-2 w-2 rounded-full bg-muted-light" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>

              {ex.notes && (
                <div className="border-t border-card-border px-4 py-2">
                  <p className="text-xs text-muted">{ex.notes}</p>
                </div>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
