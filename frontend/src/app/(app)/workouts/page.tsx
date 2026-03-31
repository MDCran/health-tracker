'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trophy01,
  Clock,
  Zap,
  SearchSm,
} from '@untitled-ui/icons-react';
import { workoutApi, exerciseApi, prApi } from '@/lib/api/workouts';
import { profileApi } from '@/lib/api/auth';
import type { WorkoutSession, PersonalRecord } from '@/types/workout';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function totalVolume(session: WorkoutSession): number {
  if (!session.exercises) return 0;
  return session.exercises.reduce((total, ex) => {
    if (!ex.sets) return total;
    return total + ex.sets.reduce((setTotal, s) => {
      return setTotal + ((s.weightKg ?? 0) * (s.reps ?? 0));
    }, 0);
  }, 0);
}

function prCount(session: WorkoutSession): number {
  if (!session.exercises) return 0;
  return session.exercises.reduce((count, ex) => {
    if (!ex.sets) return count;
    return count + ex.sets.filter(s => s.notes?.includes('PR')).length;
  }, 0);
}

function cap(s: string | null | undefined): string {
  if (!s) return '';
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export default function WorkoutsPage() {
  const router = useRouter();
  const [view, setView] = useState<'workouts' | 'prs'>('workouts');
  const [page, setPage] = useState(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [prSearch, setPrSearch] = useState('');
  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileApi.get() });
  const isImperial = profile?.unitSystem === 'IMPERIAL';

  const { data: allPRs } = useQuery<PersonalRecord[]>({
    queryKey: ['personal-records'],
    queryFn: () => prApi.list(),
    enabled: view === 'prs',
  });

  const filteredPRs = (allPRs ?? []).filter(pr => {
    if (!prSearch.trim()) return true;
    const q = prSearch.toLowerCase();
    return pr.exerciseName?.toLowerCase().includes(q) || pr.recordType?.toLowerCase().includes(q);
  });

  const prsByExercise = filteredPRs.reduce<Record<string, PersonalRecord[]>>((acc, pr) => {
    const name = cap(pr.exerciseName) || 'Unknown';
    (acc[name] ??= []).push(pr);
    return acc;
  }, {});

  const params: Record<string, string> = {
    page: String(page),
    size: '15',
  };
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;

  const { data, isLoading, error } = useQuery({
    queryKey: ['workouts', page, dateFrom, dateTo],
    queryFn: () => workoutApi.list(params),
  });

  const sessions = data?.content ?? [];
  const filteredSessions = searchQuery
    ? sessions.filter((s) =>
        (s.name || 'Untitled Workout').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sessions;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workouts</h1>
          <p className="text-sm text-muted">Track and review your training sessions</p>
        </div>
        <div className="flex gap-2">
          <Link href="/workouts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
            <Plus className="h-4 w-4" /> Start Workout
          </Link>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg border border-card-border bg-card-bg p-1 w-fit">
        <button onClick={() => setView('workouts')}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${view === 'workouts' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}>
          Workouts
        </button>
        <button onClick={() => setView('prs')}
          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${view === 'prs' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}>
          <Trophy01 className="h-3.5 w-3.5" /> Personal Records
        </button>
      </div>

      {view === 'prs' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <SearchSm className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
            <input type="text" value={prSearch} onChange={e => setPrSearch(e.target.value)}
              placeholder="Search exercises..."
              className="w-full rounded-xl border border-card-border bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-light outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>

          {Object.keys(prsByExercise).length === 0 && (
            <div className="rounded-lg border border-card-border bg-card-bg p-10 text-center">
              <Trophy01 className="mx-auto h-10 w-10 text-muted-light mb-3" />
              <p className="text-sm font-medium text-foreground">No personal records yet</p>
              <p className="text-xs text-muted mt-1">Complete workouts to start tracking PRs</p>
            </div>
          )}

          {Object.entries(prsByExercise).map(([exerciseName, prs]) => (
            <div key={exerciseName} className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
              <div className="flex items-center gap-2 bg-sidebar-bg px-4 py-3 border-b border-card-border">
                <Zap className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{exerciseName}</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                {prs.map(pr => {
                  const w = pr.weightKg ?? pr.value;
                  const displayWeight = isImperial ? Math.round(w * 2.20462) : w;
                  const weightUnit = isImperial ? 'lbs' : 'kg';
                  const reps = pr.reps ?? 0;

                  if (pr.recordType === 'MAX_WEIGHT') {
                    return (
                      <div key={pr.id} className="rounded-lg border border-primary/20 bg-primary/5 p-3 col-span-2">
                        <p className="text-[10px] font-medium text-primary uppercase tracking-wide">Best Set</p>
                        <p className="text-xl font-bold tabular-nums text-foreground mt-0.5">
                          {displayWeight} {weightUnit} <span className="text-sm font-normal text-muted">x {reps} reps</span>
                        </p>
                        {pr.setNumber && <p className="text-[10px] text-muted mt-0.5">Set #{pr.setNumber}</p>}
                        <p className="text-[10px] text-muted-light mt-1">{format(parseISO(pr.achievedAt), 'MMM d, yyyy')}</p>
                      </div>
                    );
                  }
                  if (pr.recordType === 'MAX_REPS') {
                    return (
                      <div key={pr.id} className="rounded-lg border border-card-border bg-background p-3">
                        <p className="text-[10px] font-medium text-muted uppercase tracking-wide">Most Reps</p>
                        <p className="text-lg font-bold tabular-nums text-foreground mt-0.5">{reps} reps</p>
                        <p className="text-[10px] text-muted mt-0.5">at {displayWeight} {weightUnit}</p>
                        <p className="text-[10px] text-muted-light mt-1">{format(parseISO(pr.achievedAt), 'MMM d, yyyy')}</p>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'workouts' && <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-card-border bg-card-bg p-4">
        <label className="text-sm font-medium text-muted">Filter by date:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
          className="rounded-md border border-card-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-sm text-muted">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
          className="rounded-md border border-card-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(0); }}
            className="text-sm text-danger hover:underline"
          >
            Clear
          </button>
        )}
        <div className="ml-auto relative">
          <SearchSm className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full sm:w-64 rounded-xl border border-card-border bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-light outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Failed to load workouts. Please try again.
        </div>
      )}

      {!isLoading && !error && filteredSessions.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-card-border bg-card-bg py-20">
          <Zap className="h-12 w-12 text-muted-light mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">No workouts yet</h2>
          <p className="text-sm text-muted mb-6">Start your first workout to begin tracking your progress.</p>
          <Link
            href="/workouts/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Start Workout
          </Link>
        </div>
      )}

      {!isLoading && !error && filteredSessions.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-card-border bg-card-bg">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-sidebar-bg">
                <th className="px-4 py-3 text-left font-medium text-muted">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted">Name</th>
                <th className="px-4 py-3 text-left font-medium text-muted">
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Duration</span>
                </th>
                <th className="px-4 py-3 text-center font-medium text-muted">Exercises</th>
                <th className="px-4 py-3 text-right font-medium text-muted">Total Volume</th>
                <th className="px-4 py-3 text-center font-medium text-muted">PRs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              {filteredSessions.map((session) => {
                const prs = prCount(session);
                return (
                  <tr key={session.id} onClick={() => router.push(`/workouts/${session.id}`)} className="hover:bg-sidebar-bg/50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 whitespace-nowrap text-foreground">
                      <Link href={`/workouts/${session.id}`} className="hover:text-primary">
                        {format(parseISO(session.date), 'MMM d, yyyy')}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link href={`/workouts/${session.id}`} className="hover:text-primary">
                        {session.name || 'Untitled Workout'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {session.durationSeconds
                        ? formatDuration(session.durationSeconds)
                        : session.startedAt && !session.finishedAt
                          ? 'In progress'
                          : '--'}
                    </td>
                    <td className="px-4 py-3 text-center text-muted">
                      {session.exercises?.length ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">
                      {isImperial ? (totalVolume(session) * 2.20462).toLocaleString(undefined, {maximumFractionDigits: 0}) : totalVolume(session).toLocaleString()} {isImperial ? 'lbs' : 'kg'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {prs > 0 ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-bold text-warning">
                          <Trophy01 className="h-3 w-3" />
                          {prs}
                        </span>
                      ) : (
                        <span className="text-muted-light">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Page {page + 1} of {totalPages} ({data?.totalElements ?? 0} workouts)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-card-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-card-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
