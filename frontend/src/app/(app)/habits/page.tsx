'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';
import {
  Plus,
  Check,
  Zap,
  Target01,
  XCircle,
  ChevronRight,
  BarChart01,
  X,
  SearchSm,
} from '@untitled-ui/icons-react';
import { habitsApi } from '@/lib/api/habits';
import { MILESTONE_THRESHOLDS } from '@/types/habit';
import type { Habit, DailyHabitStatus } from '@/types/habit';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from 'recharts';

type TabFilter = 'ALL' | 'GOOD' | 'BAD' | 'CATEGORY';

const DIFFICULTY_DOTS: Record<string, { count: number; color: string }> = {
  EASY: { count: 1, color: 'bg-success' },
  MEDIUM: { count: 2, color: 'bg-warning' },
  HARD: { count: 3, color: 'bg-danger' },
};

const PRIORITY_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Low',
  3: 'Medium',
  4: 'High',
  5: 'High',
};

const MILESTONE_DISPLAY = [7, 21, 30, 66, 90] as const;

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [tab, setTab] = useState<TabFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickType, setQuickType] = useState<'GOOD' | 'BAD'>('GOOD');

  const { data: dailyStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['habits-daily', today],
    queryFn: () => habitsApi.dailyStatus(today),
  });

  const { data: allHabits } = useQuery({
    queryKey: ['habits-list'],
    queryFn: () => habitsApi.list(),
  });

  const { data: historyBundle } = useQuery({
    queryKey: ['habits-with-history'],
    queryFn: async () => {
      const habitList = await habitsApi.list();
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const histories = await Promise.all(
        habitList.map((h) => habitsApi.history(h.id, { from: thirtyDaysAgo, to: today }))
      );
      return { habits: habitList, histories };
    },
  });

  const habitMap = useMemo(() => {
    const map: Record<number, Habit> = {};
    allHabits?.forEach((h) => { map[h.id] = h; });
    return map;
  }, [allHabits]);

  const goodChartData = useMemo(() => {
    const data: { day: string; date: string; pct: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      data.push({
        day: format(subDays(new Date(), i), 'MMM d'),
        date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        pct: 0,
      });
    }
    if (!historyBundle) return data;
    const goodHabits = historyBundle.habits.filter((h) => h.habitType !== 'BAD');
    if (goodHabits.length === 0) return data;
    const dateMap: Record<string, { completed: number; total: number }> = {};
    data.forEach((d) => { dateMap[d.date] = { completed: 0, total: goodHabits.length }; });
    historyBundle.histories.forEach((history, i) => {
      if (historyBundle.habits[i].habitType === 'BAD') return;
      history.forEach((log) => {
        if (dateMap[log.date] && log.completed) dateMap[log.date].completed++;
      });
    });
    return data.map((d) => ({
      ...d,
      pct: dateMap[d.date]?.total ? Math.round((dateMap[d.date].completed / dateMap[d.date].total) * 100) : 0,
    }));
  }, [historyBundle]);

  const badChartData = useMemo(() => {
    const data: { day: string; date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      data.push({
        day: format(subDays(new Date(), i), 'MMM d'),
        date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
        count: 0,
      });
    }
    if (!historyBundle) return data;
    const badHabits = historyBundle.habits.filter((h) => h.habitType === 'BAD');
    if (badHabits.length === 0) return data;
    const dateMap: Record<string, number> = {};
    data.forEach((d) => { dateMap[d.date] = 0; });
    historyBundle.histories.forEach((history, i) => {
      if (historyBundle.habits[i].habitType !== 'BAD') return;
      history.forEach((log) => {
        if (dateMap[log.date] !== undefined && log.completed) dateMap[log.date]++;
      });
    });
    return data.map((d) => ({ ...d, count: dateMap[d.date] ?? 0 }));
  }, [historyBundle]);

  const toggleMutation = useMutation({
    mutationFn: async (status: DailyHabitStatus) => {
      if (status.completed) {
        await habitsApi.unlog(status.habitId, today);
      } else {
        await habitsApi.log(status.habitId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits-daily', today] });
      queryClient.invalidateQueries({ queryKey: ['habits-with-history'] });
      queryClient.invalidateQueries({ queryKey: ['habits-list'] });
    },
  });

  const quickAddMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => habitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits-daily'] });
      queryClient.invalidateQueries({ queryKey: ['habits-list'] });
      queryClient.invalidateQueries({ queryKey: ['habits-with-history'] });
      setQuickName('');
      setShowQuickAdd(false);
    },
  });

  const handleQuickAdd = useCallback(() => {
    if (!quickName.trim()) return;
    quickAddMutation.mutate({
      name: quickName.trim(),
      habitType: quickType,
      frequency: 'DAILY',
      targetCount: 1,
      targetDays: 66,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      active: true,
    });
  }, [quickName, quickType, quickAddMutation]);

  const filtered = useMemo(() => {
    if (!dailyStatus) return [];
    let result = dailyStatus;
    if (tab === 'GOOD') result = result.filter((h) => h.habitType === 'GOOD');
    else if (tab === 'BAD') result = result.filter((h) => h.habitType === 'BAD');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((h) => {
        const habit = habitMap[h.habitId];
        return (
          h.habitName.toLowerCase().includes(q) ||
          (habit?.description ?? '').toLowerCase().includes(q)
        );
      });
    }
    return result;
  }, [dailyStatus, tab, searchQuery, habitMap]);

  const grouped = useMemo(() => {
    if (tab === 'CATEGORY') {
      const groups: Record<string, DailyHabitStatus[]> = {};
      filtered.forEach((s) => {
        const cat = habitMap[s.habitId]?.category || 'Uncategorized';
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(s);
      });
      return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    }
    const high: DailyHabitStatus[] = [];
    const medium: DailyHabitStatus[] = [];
    const low: DailyHabitStatus[] = [];
    filtered.forEach((s) => {
      const p = habitMap[s.habitId]?.priority ?? 3;
      if (p >= 4) high.push(s);
      else if (p >= 3) medium.push(s);
      else low.push(s);
    });
    const result: [string, DailyHabitStatus[]][] = [];
    if (high.length) result.push(['High Priority', high]);
    if (medium.length) result.push(['Medium Priority', medium]);
    if (low.length) result.push(['Low Priority', low]);
    if (result.length === 0 && filtered.length > 0) {
      result.push(['All Habits', filtered]);
    }
    return result;
  }, [filtered, habitMap, tab]);

  const goodHabits = dailyStatus?.filter((h) => h.habitType !== 'BAD') ?? [];
  const badHabits = dailyStatus?.filter((h) => h.habitType === 'BAD') ?? [];
  const completedGood = goodHabits.filter((h) => h.completed).length;
  const totalActive = dailyStatus?.length ?? 0;
  const totalCompleted = dailyStatus?.filter((h) =>
    h.habitType === 'BAD' ? !h.completed : h.completed
  ).length ?? 0;
  const overallRate = totalActive > 0 ? Math.round((totalCompleted / totalActive) * 100) : 0;

  const getEarnedMilestones = (status: DailyHabitStatus) => {
    const isBad = status.habitType === 'BAD';
    const streakValue = isBad ? status.daysSinceLastOccurrence : status.currentStreak;
    return MILESTONE_DISPLAY.filter((m) => streakValue >= m);
  };

  const getStackedAfterName = (habitId: number): string | null => {
    const habit = habitMap[habitId];
    if (!habit?.stackAfterHabitId) return null;
    const parent = habitMap[habit.stackAfterHabitId];
    return parent?.name ?? null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Habits</h1>
          <p className="text-sm text-muted">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link
          href="/habits/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Habit
        </Link>
      </div>

      <div className="relative">
        <SearchSm className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="w-full sm:w-64 rounded-xl border border-card-border bg-background pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-light outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="flex gap-1 rounded-lg bg-sidebar-bg p-1">
        {([
          { key: 'ALL', label: 'All' },
          { key: 'GOOD', label: 'Build' },
          { key: 'BAD', label: 'Break' },
          { key: 'CATEGORY', label: 'By Category' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === key ? 'bg-card-bg text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {dailyStatus && dailyStatus.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-card-border bg-card-bg p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalActive}</p>
            <p className="text-xs text-muted mt-1">Active Habits</p>
          </div>
          <div className="rounded-lg border border-card-border bg-card-bg p-4 text-center">
            <p className="text-2xl font-bold text-success">{totalCompleted}</p>
            <p className="text-xs text-muted mt-1">On Track Today</p>
          </div>
          <div className="rounded-lg border border-card-border bg-card-bg p-4 text-center">
            <p className={`text-2xl font-bold ${overallRate >= 80 ? 'text-success' : overallRate >= 50 ? 'text-warning' : 'text-danger'}`}>
              {overallRate}%
            </p>
            <p className="text-xs text-muted mt-1">Completion Rate</p>
          </div>
        </div>
      )}

      {statusLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!statusLoading && (!dailyStatus || dailyStatus.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-card-border bg-card-bg py-20">
          <Target01 className="h-12 w-12 text-muted-light mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">No habits yet</h2>
          <p className="text-sm text-muted mb-6">Create habits to build or bad habits to break.</p>
          <Link
            href="/habits/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus className="h-4 w-4" />
            Create Your First Habit
          </Link>
        </div>
      )}

      {grouped.map(([groupLabel, items]) => (
        <div key={groupLabel} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted px-1">{groupLabel}</h3>
          {items.map((status) => {
            const isBad = status.habitType === 'BAD';
            const habit = habitMap[status.habitId];
            const diff = habit?.difficulty ? DIFFICULTY_DOTS[habit.difficulty] : null;
            const earned = getEarnedMilestones(status);
            const stackedName = getStackedAfterName(status.habitId);

            return (
              <div
                key={status.habitId}
                className={`rounded-lg border bg-card-bg px-4 py-3.5 transition-colors ${
                  isBad
                    ? status.completed
                      ? 'border-danger/30 bg-danger/5'
                      : 'border-card-border hover:border-success/30'
                    : status.completed
                      ? 'border-success/30 bg-success/5'
                      : 'border-card-border hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {isBad ? (
                      <button
                        onClick={() => toggleMutation.mutate(status)}
                        disabled={toggleMutation.isPending}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                          status.completed
                            ? 'bg-danger text-white'
                            : 'border-2 border-card-border text-transparent hover:border-danger'
                        }`}
                        title={status.completed ? 'Logged today (click to undo)' : 'Log occurrence'}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleMutation.mutate(status)}
                        disabled={toggleMutation.isPending}
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors ${
                          status.completed
                            ? 'bg-success text-white'
                            : 'border-2 border-card-border text-transparent hover:border-success'
                        }`}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {status.color && (
                          <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: status.color }} />
                        )}
                        <span className={`text-sm font-medium ${
                          isBad
                            ? status.completed ? 'text-danger' : 'text-foreground'
                            : status.completed ? 'text-muted line-through' : 'text-foreground'
                        }`}>
                          {status.habitName}
                        </span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          isBad
                            ? 'bg-danger/10 text-danger'
                            : 'bg-success/10 text-success'
                        }`}>
                          {isBad ? 'BREAK' : 'BUILD'}
                        </span>
                        {habit?.category && (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {habit.category}
                          </span>
                        )}
                        {diff && (
                          <span className="inline-flex items-center gap-0.5 ml-1" title={`${habit?.difficulty} difficulty`}>
                            {Array.from({ length: diff.count }).map((_, i) => (
                              <span key={i} className={`inline-block h-1.5 w-1.5 rounded-full ${diff.color}`} />
                            ))}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {!isBad && status.currentStreak > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-warning font-semibold">
                            <Zap className="h-3 w-3" />
                            {status.currentStreak} day streak
                          </span>
                        )}
                        {isBad && (
                          <span className={`text-xs font-semibold ${status.daysSinceLastOccurrence === 0 ? 'text-danger' : 'text-success'}`}>
                            {status.daysSinceLastOccurrence === 0
                              ? 'Occurred today'
                              : status.daysSinceLastOccurrence < 0
                                ? 'Never occurred'
                                : `${status.daysSinceLastOccurrence} day${status.daysSinceLastOccurrence !== 1 ? 's' : ''} clean`}
                          </span>
                        )}
                      </div>

                      {status.targetDays > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-muted">
                              {isBad ? 'Breaking' : 'Formation'}
                            </span>
                            <span className="text-[10px] font-medium text-muted">
                              {Math.round(status.formationProgress)}% of {status.targetDays}d
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-sidebar-bg overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${isBad ? 'bg-success' : 'bg-primary'}`}
                              style={{ width: `${Math.min(100, status.formationProgress)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {habit?.cue && habit?.routine && habit?.reward && (
                        <p className="mt-1.5 text-[10px] text-muted truncate">
                          {habit.cue} &rarr; {habit.routine} &rarr; {habit.reward}
                        </p>
                      )}

                      {stackedName && (
                        <p className="mt-1 text-[10px] text-muted italic">
                          Stacked after: {stackedName}
                        </p>
                      )}

                      {earned.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          {MILESTONE_DISPLAY.map((m) => {
                            const isEarned = earned.includes(m);
                            return (
                              <span
                                key={m}
                                className={`inline-flex items-center justify-center h-5 min-w-[28px] rounded-full text-[9px] font-bold ${
                                  isEarned
                                    ? 'bg-warning/15 text-warning'
                                    : 'bg-sidebar-bg text-muted-light/50'
                                }`}
                                title={`${m}-day milestone`}
                              >
                                {m}d
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/habits/${status.habitId}`}
                    className="mt-0.5 flex items-center gap-0.5 text-xs text-muted hover:text-primary shrink-0 transition-colors"
                  >
                    Details
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {dailyStatus && dailyStatus.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart01 className="h-5 w-5 text-muted" />
            Statistics
          </h2>

          {goodHabits.length > 0 && (
            <div className="rounded-lg border border-card-border bg-card-bg p-4">
              <h3 className="font-semibold text-foreground mb-1 text-sm">30-Day Good Habit Adherence</h3>
              <p className="text-xs text-muted mb-4">Daily completion rate for habits you are building</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={goodChartData} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted)' }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value) => [`${value}%`, 'Adherence']}
                    />
                    <Bar dataKey="pct" radius={[2, 2, 0, 0]}>
                      {goodChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.pct >= 80 ? '#10b981' : entry.pct >= 50 ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {badHabits.length > 0 && (
            <div className="rounded-lg border border-card-border bg-card-bg p-4">
              <h3 className="font-semibold text-foreground mb-1 text-sm">30-Day Bad Habit Occurrences</h3>
              <p className="text-xs text-muted mb-4">Daily occurrences of habits you are breaking (declining is good)</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={badChartData} barCategoryGap="15%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--muted)' }} interval={4} />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(value) => [`${value}`, 'Occurrences']}
                    />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {badChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.count === 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-dashed border-card-border bg-card-bg p-4">
        {!showQuickAdd ? (
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex w-full items-center justify-center gap-2 text-sm text-muted hover:text-foreground transition-colors py-1"
          >
            <Plus className="h-4 w-4" />
            Quick Add Habit
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Quick Add</h4>
              <button onClick={() => setShowQuickAdd(false)} className="text-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setQuickType('GOOD')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  quickType === 'GOOD'
                    ? 'bg-success/10 text-success border border-success'
                    : 'border border-card-border text-muted hover:border-success'
                }`}
              >
                Build
              </button>
              <button
                onClick={() => setQuickType('BAD')}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  quickType === 'BAD'
                    ? 'bg-danger/10 text-danger border border-danger'
                    : 'border border-card-border text-muted hover:border-danger'
                }`}
              >
                Break
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Habit name..."
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
                className="flex-1 rounded-lg border border-card-border bg-sidebar-bg px-3 py-2 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none"
              />
              <button
                onClick={handleQuickAdd}
                disabled={!quickName.trim() || quickAddMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
              >
                {quickAddMutation.isPending ? 'Adding...' : 'Add'}
              </button>
            </div>
            {quickAddMutation.isError && (
              <p className="text-xs text-danger">Failed to add habit.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
