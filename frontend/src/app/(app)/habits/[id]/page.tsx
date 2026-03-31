'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subDays, startOfWeek, eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import Link from 'next/link';
import {
  ArrowLeft,
  Zap,
  Trash01,
  Edit01,
  Check,
  Target01,
  Trophy01,
  Calendar,
  Clock,
} from '@untitled-ui/icons-react';
import { habitsApi } from '@/lib/api/habits';
import { MILESTONE_THRESHOLDS } from '@/types/habit';
import type { Habit, HabitLog, HabitMilestone } from '@/types/habit';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

export default function HabitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const habitId = Number(params.id);

  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const ninetyDaysAgo = format(subDays(new Date(), 90), 'yyyy-MM-dd');
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: habit, isLoading } = useQuery<Habit>({
    queryKey: ['habit', habitId],
    queryFn: () => habitsApi.get(habitId),
    enabled: !!habitId,
  });

  const { data: history } = useQuery<HabitLog[]>({
    queryKey: ['habit-history', habitId],
    queryFn: () => habitsApi.history(habitId, { from: ninetyDaysAgo, to: today }),
    enabled: !!habitId,
  });

  const { data: milestones } = useQuery<HabitMilestone[]>({
    queryKey: ['habit-milestones', habitId],
    queryFn: () => habitsApi.milestones(habitId),
    enabled: !!habitId,
  });

  const { data: stackedHabit } = useQuery<Habit>({
    queryKey: ['habit', habit?.stackAfterHabitId],
    queryFn: () => habitsApi.get(habit!.stackAfterHabitId!),
    enabled: !!habit?.stackAfterHabitId,
  });

  const deleteMutation = useMutation({
    mutationFn: () => habitsApi.delete(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits-list'] });
      router.push('/habits');
    },
  });

  const logMap = useMemo(() => {
    const map = new Map<string, HabitLog>();
    history?.forEach((log) => { map.set(log.date, log); });
    return map;
  }, [history]);

  const heatmapData = useMemo(() => {
    const days: { date: string; label: string; completed: boolean; dayOfWeek: number; weekIndex: number }[] = [];
    const startDate = subDays(new Date(), 29);
    const allDays = eachDayOfInterval({ start: startDate, end: new Date() });
    const firstWeekStart = startOfWeek(startDate, { weekStartsOn: 0 });

    allDays.forEach((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const log = logMap.get(dateStr);
      const dayOfWeek = day.getDay();
      const weekDiff = Math.floor((day.getTime() - firstWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000));
      days.push({
        date: dateStr,
        label: format(day, 'MMM d'),
        completed: log?.completed ?? false,
        dayOfWeek,
        weekIndex: weekDiff,
      });
    });
    return days;
  }, [logMap]);

  const weeklyTrend = useMemo(() => {
    const weeks: { week: string; rate: number }[] = [];
    const startDate = subDays(new Date(), 83);
    const weekStarts = eachWeekOfInterval(
      { start: startDate, end: new Date() },
      { weekStartsOn: 1 }
    );
    weekStarts.forEach((weekStart) => {
      const weekDays = eachDayOfInterval({
        start: weekStart,
        end: new Date(Math.min(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000, new Date().getTime())),
      });
      let completed = 0;
      let total = 0;
      weekDays.forEach((d) => {
        const dateStr = format(d, 'yyyy-MM-dd');
        const log = logMap.get(dateStr);
        if (log !== undefined) {
          total++;
          if (log.completed) completed++;
        }
      });
      weeks.push({
        week: format(weekStart, 'MMM d'),
        rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      });
    });
    return weeks;
  }, [logMap]);

  const badFrequencyData = useMemo(() => {
    if (!habit || habit.habitType !== 'BAD') return [];
    const startDate = subDays(new Date(), 83);
    const weekStarts = eachWeekOfInterval(
      { start: startDate, end: new Date() },
      { weekStartsOn: 1 }
    );
    return weekStarts.map((weekStart) => {
      const weekDays = eachDayOfInterval({
        start: weekStart,
        end: new Date(Math.min(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000, new Date().getTime())),
      });
      let count = 0;
      weekDays.forEach((d) => {
        const log = logMap.get(format(d, 'yyyy-MM-dd'));
        if (log?.completed) count++;
      });
      return { week: format(weekStart, 'MMM d'), count };
    });
  }, [habit, logMap]);

  const recentLogs = useMemo(() => {
    if (!history) return [];
    return [...history]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20);
  }, [history]);

  const milestoneMap = useMemo(() => {
    const map = new Map<number, HabitMilestone>();
    milestones?.forEach((m) => { map.set(m.milestoneValue, m); });
    return map;
  }, [milestones]);

  const totalCompletions = useMemo(() => {
    return history?.filter((l) => l.completed).length ?? 0;
  }, [history]);

  const handleDelete = () => {
    if (confirm('Delete this habit? This cannot be undone.')) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl border border-card-border bg-card-bg" />
        ))}
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-muted">Habit not found</p>
        <Link href="/habits" className="mt-4 text-sm text-primary hover:underline">Back to Habits</Link>
      </div>
    );
  }

  const isBad = habit.habitType === 'BAD';
  const frequencyLabel =
    habit.frequency === 'DAILY'
      ? 'Daily'
      : habit.frequency === 'WEEKLY'
        ? `${habit.targetCount}x per week`
        : `${habit.targetCount}x per month`;

  const maxWeek = Math.max(...heatmapData.map((d) => d.weekIndex), 0);

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/habits"
            className="rounded-md p-1.5 text-muted hover:bg-card-border/50 hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {habit.color && (
                <span className="inline-block h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: habit.color }} />
              )}
              <h1 className="text-2xl font-bold text-foreground truncate">{habit.name}</h1>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isBad ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
              }`}>
                {isBad ? 'BREAK' : 'BUILD'}
              </span>
            </div>
            {habit.description && (
              <p className="text-sm text-muted mt-0.5">{habit.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="rounded-lg border border-danger/30 bg-danger/5 p-2 text-danger hover:bg-danger/10 disabled:opacity-50 transition-colors"
            title="Delete habit"
          >
            <Trash01 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Overview</h3>

        {(habit.cue || habit.routine || habit.reward) && (
          <div className="rounded-lg bg-sidebar-bg p-3">
            <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">Habit Loop</p>
            <div className="flex items-center gap-2 text-sm">
              {habit.cue && (
                <span className="rounded-md bg-info/10 px-2 py-1 text-xs text-info font-medium">{habit.cue}</span>
              )}
              {habit.cue && habit.routine && <span className="text-muted">&rarr;</span>}
              {habit.routine && (
                <span className="rounded-md bg-primary/10 px-2 py-1 text-xs text-primary font-medium">{habit.routine}</span>
              )}
              {habit.routine && habit.reward && <span className="text-muted">&rarr;</span>}
              {habit.reward && (
                <span className="rounded-md bg-success/10 px-2 py-1 text-xs text-success font-medium">{habit.reward}</span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">Schedule</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{frequencyLabel}</p>
          </div>
          {habit.category && (
            <div>
              <p className="text-xs text-muted">Category</p>
              <p className="mt-1">
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{habit.category}</span>
              </p>
            </div>
          )}
          {habit.difficulty && (
            <div>
              <p className="text-xs text-muted">Difficulty</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {DIFFICULTY_LABELS[habit.difficulty] ?? habit.difficulty}
              </p>
            </div>
          )}
          {habit.priority && (
            <div>
              <p className="text-xs text-muted">Priority</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {PRIORITY_LABELS[habit.priority] ?? habit.priority}
              </p>
            </div>
          )}
        </div>

        {stackedHabit && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Stacked after:</span>
            <Link href={`/habits/${stackedHabit.id}`} className="text-primary hover:underline font-medium">
              {stackedHabit.name}
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="h-4 w-4 text-warning" />
          </div>
          <p className="text-xl font-bold text-foreground">
            {isBad ? habit.daysSinceLastOccurrence : habit.currentStreak}
          </p>
          <p className="text-[10px] text-muted">
            {isBad ? 'Days Clean' : 'Current Streak'}
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Target01 className="h-4 w-4 text-primary" />
          </div>
          <p className="text-xl font-bold text-foreground">{habit.longestStreak}</p>
          <p className="text-[10px] text-muted">Longest Streak</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-xl font-bold text-foreground">{Math.round(habit.completionRate * 100)}%</p>
          <p className="text-[10px] text-muted">Completion Rate</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-xl font-bold text-foreground">{totalCompletions}</p>
          <p className="text-[10px] text-muted">
            {isBad ? 'Total Occurrences' : 'Total Completions'}
          </p>
        </div>
        <div className="rounded-xl border border-card-border bg-card-bg p-4 text-center col-span-2 sm:col-span-1">
          <p className={`text-xl font-bold ${
            habit.formationProgress >= 100 ? 'text-success' : 'text-primary'
          }`}>
            {Math.round(habit.formationProgress)}%
          </p>
          <p className="text-[10px] text-muted">
            {isBad ? 'Breaking' : 'Formation'} ({habit.targetDays}d)
          </p>
          <div className="mt-1.5 h-1.5 rounded-full bg-sidebar-bg overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${isBad ? 'bg-success' : 'bg-primary'}`}
              style={{ width: `${Math.min(100, habit.formationProgress)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Trophy01 className="h-4 w-4 text-warning" />
          Milestones
        </h3>
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
          {MILESTONE_THRESHOLDS.map((threshold) => {
            const milestone = milestoneMap.get(threshold);
            const isEarned = !!milestone;
            return (
              <div
                key={threshold}
                className={`flex flex-col items-center rounded-lg p-2 transition-colors ${
                  isEarned ? 'bg-warning/10' : 'bg-sidebar-bg'
                }`}
                title={isEarned ? `Achieved ${format(parseISO(milestone.achievedAt), 'MMM d, yyyy')}` : `${threshold} days - not yet achieved`}
              >
                <span className={`text-lg ${isEarned ? '' : 'grayscale opacity-30'}`}>
                  {threshold >= 365 ? '🏆' : threshold >= 100 ? '🥇' : threshold >= 60 ? '🥈' : threshold >= 21 ? '🥉' : '⭐'}
                </span>
                <span className={`text-[10px] font-bold mt-0.5 ${
                  isEarned ? 'text-warning' : 'text-muted-light'
                }`}>
                  {threshold}d
                </span>
                {isEarned && (
                  <span className="text-[8px] text-muted mt-0.5">
                    {format(parseISO(milestone.achievedAt), 'M/d')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-card-border bg-card-bg p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted" />
            30-Day Completion Heatmap
          </h3>
          <div className="overflow-x-auto">
            <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${maxWeek + 1}, 1fr)` }}>
              {Array.from({ length: 7 }).map((_, dayOfWeek) => (
                <div key={dayOfWeek} className="contents">
                  {Array.from({ length: maxWeek + 1 }).map((_, weekIdx) => {
                    const cell = heatmapData.find(
                      (d) => d.dayOfWeek === dayOfWeek && d.weekIndex === weekIdx
                    );
                    if (!cell) {
                      return <div key={`${dayOfWeek}-${weekIdx}`} className="h-4 w-4" />;
                    }
                    return (
                      <div
                        key={cell.date}
                        className={`h-4 w-4 rounded-sm transition-colors ${
                          isBad
                            ? cell.completed
                              ? 'bg-danger'
                              : 'bg-success/30'
                            : cell.completed
                              ? 'bg-success'
                              : 'bg-sidebar-bg'
                        }`}
                        title={`${cell.label}: ${
                          isBad
                            ? cell.completed ? 'Occurred' : 'Clean'
                            : cell.completed ? 'Completed' : 'Missed'
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
              <span className="flex items-center gap-1">
                <span className={`inline-block h-3 w-3 rounded-sm ${isBad ? 'bg-success/30' : 'bg-sidebar-bg'}`} />
                {isBad ? 'Clean' : 'Missed'}
              </span>
              <span className="flex items-center gap-1">
                <span className={`inline-block h-3 w-3 rounded-sm ${isBad ? 'bg-danger' : 'bg-success'}`} />
                {isBad ? 'Occurred' : 'Completed'}
              </span>
            </div>
          </div>
        </div>

        {!isBad && (
          <div className="rounded-xl border border-card-border bg-card-bg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Completion Rate</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [`${value}%`, 'Completion Rate']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={{ fill: '#7c3aed', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {isBad && badFrequencyData.length > 0 && (
          <div className="rounded-xl border border-card-border bg-card-bg p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Weekly Occurrence Frequency</h3>
            <p className="text-xs text-muted mb-4">A declining trend means you are making progress</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={badFrequencyData} barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [`${value}`, 'Occurrences']}
                  />
                  <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                    {badFrequencyData.map((entry, index) => (
                      <Cell key={index} fill={entry.count === 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
        <div className="px-5 py-3 border-b border-card-border flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted" />
          <h3 className="text-sm font-semibold text-foreground">Recent Logs</h3>
        </div>
        {recentLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-sidebar-bg">
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted">Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted">Mood</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted">Intensity</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-muted">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {recentLogs.map((log) => (
                  <tr key={log.date} className="hover:bg-sidebar-bg/50">
                    <td className="px-4 py-2.5 text-foreground whitespace-nowrap">
                      {format(parseISO(log.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        log.completed
                          ? isBad ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
                          : 'bg-muted-light/10 text-muted'
                      }`}>
                        {log.completed ? (
                          <>{isBad ? 'Occurred' : <><Check className="h-3 w-3" /> Done</>}</>
                        ) : (
                          isBad ? 'Clean' : 'Missed'
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {log.mood ?? '-'}
                    </td>
                    <td className="px-4 py-2.5 text-muted">
                      {log.intensity != null ? `${log.intensity}/10` : '-'}
                    </td>
                    <td className="px-4 py-2.5 text-muted truncate max-w-[200px]">
                      {log.notes ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-muted">
            No logs yet
          </div>
        )}
      </div>
    </div>
  );
}
