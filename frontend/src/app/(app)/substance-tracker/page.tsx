'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import {
  Plus,
  Trophy01,
  TrendUp01,
  TrendDown01,
  Calendar,
  Clock,
  Trash01,
  Edit05,
  Check,
  XClose,
  BarChart07,
  Target04,
  FaceSmile,
  SearchSm,
} from '@untitled-ui/icons-react';
import { substanceApi } from '@/lib/api/substance';
import type { SubstanceStats } from '@/types/substance';
import { SUBSTANCE_TYPES } from '@/types/substance';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const ALL_TAB = { value: 'ALL' as const, label: 'All', color: '#6366f1' };

function getSubstanceColor(type: string, customTypes?: { key: string; color: string }[]): string {
  const builtin = SUBSTANCE_TYPES.find((t) => t.value === type);
  if (builtin) return builtin.color;
  const custom = customTypes?.find((t) => t.key === type);
  return custom?.color ?? '#64748b';
}

function getSubstanceLabel(type: string, customTypes?: { key: string; name: string }[]): string {
  const builtin = SUBSTANCE_TYPES.find((t) => t.value === type);
  if (builtin) return builtin.label;
  const custom = customTypes?.find((t) => t.key === type);
  return custom?.name ?? type;
}

function CleanDaysRing({ days, color, size = 120 }: { days: number; color: string; size?: number }) {
  const maxDays = 365;
  const progress = Math.min(days / maxDays, 1);
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{days}</span>
        <span className="text-xs text-muted">days clean</span>
      </div>
    </div>
  );
}

function StatsCard({ stats, customTypes }: { stats: SubstanceStats; customTypes?: { key: string; name: string; color: string }[] }) {
  const color = getSubstanceColor(stats.substanceType, customTypes);
  const label = getSubstanceLabel(stats.substanceType, customTypes);

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
      </div>

      <div className="flex items-center gap-6">
        <CleanDaysRing days={stats.currentCleanStreak} color={color} />

        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy01 className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs text-muted">Longest streak</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{stats.longestCleanStreak}d</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs text-muted">This week</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{stats.occurrencesThisWeek}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <BarChart07 className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs text-muted">This month</span>
            </div>
            <span className="text-sm font-semibold text-foreground">{stats.occurrencesThisMonth}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FaceSmile className="h-3.5 w-3.5 text-muted" />
              <span className="text-xs text-muted">Mood</span>
            </div>
            <span className="text-sm text-foreground">
              <span className="text-muted">before</span>{' '}
              <span className="font-semibold">{stats.avgMoodBefore.toFixed(1)}</span>
              <span className="text-muted mx-1">/</span>
              <span className="text-muted">after</span>{' '}
              <span className="font-semibold">{stats.avgMoodAfter.toFixed(1)}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-card-border flex items-center justify-between text-xs text-muted">
        <span>{stats.totalOccurrences} total logged</span>
        {stats.currentCleanStreak > 0 && stats.currentCleanStreak >= stats.longestCleanStreak && (
          <span className="text-primary font-semibold flex items-center gap-1">
            <TrendUp01 className="h-3 w-3" />
            Personal best!
          </span>
        )}
      </div>
    </div>
  );
}

const MOOD_LABELS: Record<number, string> = {
  1: 'Terrible',
  2: 'Bad',
  3: 'Okay',
  4: 'Good',
  5: 'Great',
};

function EditMoodPicker({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(value === v ? null : v)}
          className={`h-7 w-7 rounded text-xs font-bold transition-colors ${
            value === v
              ? 'bg-primary text-white'
              : 'border border-card-border text-muted hover:border-primary'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

export default function SubstanceTrackerPage() {
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<{
    amount: string;
    context: string;
    notes: string;
    moodBefore: number | null;
    moodAfter: number | null;
  }>({ amount: '', context: '', notes: '', moodBefore: null, moodAfter: null });
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [newCustomName, setNewCustomName] = useState('');
  const [newCustomColor, setNewCustomColor] = useState('#6366f1');
  const queryClient = useQueryClient();

  const { data: customTypes } = useQuery({
    queryKey: ['substance-custom-types'],
    queryFn: () => substanceApi.customTypes(),
  });

  const createCustomTypeMutation = useMutation({
    mutationFn: (data: { name: string; color: string }) => substanceApi.createCustomType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substance-custom-types'] });
      setShowAddCustom(false);
      setNewCustomName('');
      setNewCustomColor('#6366f1');
    },
  });

  const tabs = useMemo(() => {
    const base = [ALL_TAB, ...SUBSTANCE_TYPES];
    if (customTypes) {
      for (const ct of customTypes) {
        base.push({ value: ct.key as never, label: ct.name, icon: 'circle', color: ct.color });
      }
    }
    return base;
  }, [customTypes]);

  const { data: allStats, isLoading: statsLoading } = useQuery({
    queryKey: ['substance-stats-all'],
    queryFn: () => substanceApi.allStats(),
  });

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['substance-logs', activeTab],
    queryFn: () =>
      activeTab === 'ALL'
        ? substanceApi.list()
        : substanceApi.list({ type: activeTab }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => substanceApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['substance-stats-all'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      substanceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substance-logs'] });
      queryClient.invalidateQueries({ queryKey: ['substance-stats-all'] });
      setEditingId(null);
    },
  });

  function startEditing(log: { id: number; amount: string | null; context: string | null; notes: string | null; moodBefore: number | null; moodAfter: number | null }) {
    setEditingId(log.id);
    setEditData({
      amount: log.amount || '',
      context: log.context || '',
      notes: log.notes || '',
      moodBefore: log.moodBefore,
      moodAfter: log.moodAfter,
    });
  }

  function saveEdit() {
    if (editingId === null) return;
    updateMutation.mutate({
      id: editingId,
      data: {
        amount: editData.amount.trim() || null,
        context: editData.context.trim() || null,
        notes: editData.notes.trim() || null,
        moodBefore: editData.moodBefore,
        moodAfter: editData.moodAfter,
      },
    });
  }

  const filteredStats = useMemo(() => {
    if (!allStats) return [];
    const cleaned = allStats.filter((s) => s.substanceType !== 'MASTURBATION');
    if (activeTab === 'ALL') return cleaned;
    return cleaned.filter((s) => s.substanceType === activeTab);
  }, [allStats, activeTab]);

  const weeklyChartData = useMemo(() => {
    if (!filteredStats || filteredStats.length === 0) return [];

    if (filteredStats.length === 1) {
      return filteredStats[0].weeklyTrend.map((w) => ({
        week: w.week,
        [filteredStats[0].substanceType]: w.count,
      }));
    }

    const weekMap = new Map<string, Record<string, number>>();
    filteredStats.forEach((stats) => {
      stats.weeklyTrend.forEach((w) => {
        const existing = weekMap.get(w.week) ?? { week: 0 };
        existing[stats.substanceType] = w.count;
        weekMap.set(w.week, existing);
      });
    });

    return Array.from(weekMap.entries()).map(([week, counts]) => ({
      week,
      ...counts,
    }));
  }, [filteredStats]);

  const moodChartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    return [...logs]
      .filter((l) => l.moodBefore != null && l.moodAfter != null)
      .sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
      .slice(-20)
      .map((l) => ({
        date: format(parseISO(l.occurredAt), 'MMM d'),
        moodBefore: l.moodBefore,
        moodAfter: l.moodAfter,
      }));
  }, [logs]);

  const isLoading = statsLoading || logsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Substance Tracker</h1>
          <p className="text-sm text-muted">Monitor habits and celebrate clean streaks</p>
        </div>
        <Link
          href="/substance-tracker/log"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Occurrence
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 rounded-lg border border-card-border bg-card-bg p-1 w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-primary text-white'
                : 'text-muted hover:text-foreground hover:bg-sidebar-bg'
            }`}
          >
            {tab.value !== 'ALL' && (
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: activeTab === tab.value ? '#fff' : tab.color }}
              />
            )}
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setShowAddCustom(!showAddCustom)}
          className="flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:text-foreground hover:bg-sidebar-bg transition-colors"
        >
          <Plus className="h-3 w-3" />
        </button>
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
      </div>

      {showAddCustom && (
        <div className="rounded-lg border border-card-border bg-card-bg p-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Name</label>
            <input
              type="text"
              value={newCustomName}
              onChange={(e) => setNewCustomName(e.target.value)}
              placeholder="e.g., Caffeine, Nicotine"
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Color</label>
            <input
              type="color"
              value={newCustomColor}
              onChange={(e) => setNewCustomColor(e.target.value)}
              className="h-9 w-14 rounded border border-card-border cursor-pointer"
            />
          </div>
          <button
            onClick={() => {
              if (newCustomName.trim()) {
                createCustomTypeMutation.mutate({ name: newCustomName.trim(), color: newCustomColor });
              }
            }}
            disabled={!newCustomName.trim() || createCustomTypeMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
          >
            Add
          </button>
          <button
            onClick={() => setShowAddCustom(false)}
            className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && (
        <>
          {filteredStats.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredStats.map((stats) => (
                <StatsCard key={stats.substanceType} stats={stats} customTypes={customTypes} />
              ))}
            </div>
          )}

          {weeklyChartData.length > 0 && (
            <div className="rounded-lg border border-card-border bg-card-bg p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendDown01 className="h-4 w-4 text-muted" />
                <h3 className="font-semibold text-foreground">Weekly Frequency (Last 12 Weeks)</h3>
              </div>
              <p className="text-xs text-muted mb-4">Fewer occurrences = progress. Aim for a declining trend.</p>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    {filteredStats.map((s) => (
                      <Bar
                        key={s.substanceType}
                        dataKey={s.substanceType}
                        fill={getSubstanceColor(s.substanceType, customTypes)}
                        radius={[4, 4, 0, 0]}
                        name={getSubstanceLabel(s.substanceType, customTypes)}
                      />
                    ))}
                    {filteredStats.length > 1 && <Legend />}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {moodChartData.length > 0 && (
            <div className="rounded-lg border border-card-border bg-card-bg p-4">
              <div className="flex items-center gap-2 mb-4">
                <FaceSmile className="h-4 w-4 text-muted" />
                <h3 className="font-semibold text-foreground">Mood: Before vs After</h3>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={moodChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value, name) => [
                        `${value} (${MOOD_LABELS[Number(value)] ?? ''})`,
                        String(name),
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="moodBefore"
                      stroke="#60a5fa"
                      strokeWidth={2}
                      dot={{ fill: '#60a5fa', r: 3 }}
                      name="Mood Before"
                    />
                    <Line
                      type="monotone"
                      dataKey="moodAfter"
                      stroke="#f87171"
                      strokeWidth={2}
                      dot={{ fill: '#f87171', r: 3 }}
                      name="Mood After"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {logs && logs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Recent History</h3>
              <div className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-sidebar-bg">
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted">Type</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted">When</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted hidden sm:table-cell">Amount</th>
                      <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted hidden md:table-cell">Mood</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.filter((log) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        log.amount?.toLowerCase().includes(q) ||
                        log.context?.toLowerCase().includes(q) ||
                        log.notes?.toLowerCase().includes(q)
                      );
                    }).slice(0, 20).map((log) => (
                      <tr key={log.id} className="border-b border-card-border last:border-b-0 hover:bg-sidebar-bg/50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: getSubstanceColor(log.substanceType, customTypes) }}
                            />
                            <span className="font-medium text-foreground">
                              {getSubstanceLabel(log.substanceType, customTypes)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-muted">
                            <Clock className="h-3 w-3" />
                            <span>{format(parseISO(log.occurredAt), 'MMM d, h:mm a')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-muted hidden sm:table-cell">
                          {editingId === log.id ? (
                            <input
                              type="text"
                              value={editData.amount}
                              onChange={(e) => setEditData((d) => ({ ...d, amount: e.target.value }))}
                              className="w-full rounded border border-card-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                              placeholder="Amount"
                            />
                          ) : (
                            log.amount || '-'
                          )}
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          {editingId === log.id ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-xs text-muted">
                                <span>Before:</span>
                                <EditMoodPicker value={editData.moodBefore} onChange={(v) => setEditData((d) => ({ ...d, moodBefore: v }))} />
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted">
                                <span>After:</span>
                                <EditMoodPicker value={editData.moodAfter} onChange={(v) => setEditData((d) => ({ ...d, moodAfter: v }))} />
                              </div>
                            </div>
                          ) : log.moodBefore != null && log.moodAfter != null ? (
                            <span className="text-muted">
                              {log.moodBefore}{' '}
                              {log.moodAfter > log.moodBefore ? (
                                <TrendUp01 className="inline h-3 w-3 text-green-500" />
                              ) : log.moodAfter < log.moodBefore ? (
                                <TrendDown01 className="inline h-3 w-3 text-red-500" />
                              ) : (
                                <span className="text-xs">--</span>
                              )}{' '}
                              {log.moodAfter}
                            </span>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {editingId === log.id ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={saveEdit}
                                disabled={updateMutation.isPending}
                                className="inline-flex items-center rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="inline-flex items-center rounded-md px-2 py-1 text-xs text-muted hover:bg-card-border/50 transition-colors"
                              >
                                <XClose className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEditing(log)}
                                className="inline-flex items-center rounded-md px-2 py-1 text-xs text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                              >
                                <Edit05 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => deleteMutation.mutate(log.id)}
                                disabled={deleteMutation.isPending}
                                className="inline-flex items-center rounded-md px-2 py-1 text-xs text-danger hover:bg-danger/10 transition-colors"
                              >
                                <Trash01 className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {(!logs || logs.length === 0) && (!allStats || allStats.length === 0) && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-card-border bg-card-bg py-20">
              <Target04 className="h-12 w-12 text-muted-light mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-1">No entries yet</h2>
              <p className="text-sm text-muted mb-6">Start tracking to see your clean streaks and patterns.</p>
              <Link
                href="/substance-tracker/log"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                Log First Entry
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
