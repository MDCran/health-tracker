'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO, subDays } from 'date-fns';
import {
  Plus,
  Clock,
  Star01,
  AlertCircle,
  Hourglass01,
  Moon01,
  SearchSm,
} from '@untitled-ui/icons-react';
import { sleepApi } from '@/lib/api/sleep';
import type { SleepEntry, SleepStats } from '@/types/sleep';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const TIME_RANGES = [
  { key: '1W', label: '1W', days: 7 },
  { key: '2W', label: '2W', days: 14 },
  { key: '1M', label: '1M', days: 30 },
  { key: '3M', label: '3M', days: 90 },
] as const;

const STAGE_COLORS: Record<string, string> = {
  light: '#60a5fa',
  deep: '#1e40af',
  rem: '#a78bfa',
  awake: '#f87171',
};

function StatCard({ label, value, unit, icon: Icon }: { label: string; value: string | number; unit?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted" />
        <p className="text-xs font-medium text-muted">{label}</p>
      </div>
      <p className="text-2xl font-bold text-foreground">
        {value}
        {unit && <span className="text-sm font-normal text-muted ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function QualityDots({ quality }: { quality: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 10 }, (_, i) => (
        <div
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < quality ? 'bg-primary' : 'bg-sidebar-bg'
          }`}
        />
      ))}
    </div>
  );
}

export default function SleepDashboardPage() {
  const [rangeKey, setRangeKey] = useState<string>('1M');
  const [searchQuery, setSearchQuery] = useState('');

  const range = TIME_RANGES.find((r) => r.key === rangeKey) ?? TIME_RANGES[2];
  const to = format(new Date(), 'yyyy-MM-dd');
  const from = format(subDays(new Date(), range.days), 'yyyy-MM-dd');

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['sleep-stats', from, to],
    queryFn: () => sleepApi.stats({ from, to }),
    retry: 1,
  });

  const { data: entriesData, isLoading: entriesLoading, error: entriesError } = useQuery({
    queryKey: ['sleep-entries', from, to],
    queryFn: () => sleepApi.list({ from, to }),
    retry: 1,
  });

  const entries: SleepEntry[] = useMemo(() => {
    if (!entriesData) return [];
    if (Array.isArray(entriesData)) return entriesData;
    return (entriesData as { content?: SleepEntry[] }).content ?? [];
  }, [entriesData]);

  const isLoading = statsLoading || entriesLoading;

  const stagesData = useMemo(() => {
    const recent = [...entries].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
    return recent.map((e) => ({
      date: format(parseISO(e.date), 'MMM d'),
      light: e.estimatedSleepStages?.light ?? 0,
      deep: e.estimatedSleepStages?.deep ?? 0,
      rem: e.estimatedSleepStages?.rem ?? 0,
      awake: e.estimatedSleepStages?.awake ?? 0,
    }));
  }, [entries]);

  const chartData = useMemo(() => {
    if (!stats?.dataPoints) return [];
    return stats.dataPoints.map((dp) => ({
      date: format(parseISO(dp.date), 'MMM d'),
      hours: dp.hours,
      quality: dp.quality,
    }));
  }, [stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sleep</h1>
          <p className="text-sm text-muted">Track and analyze your sleep patterns</p>
        </div>
        <Link
          href="/sleep/log"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Sleep
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-card-border bg-card-bg p-1 w-fit">
          {TIME_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRangeKey(r.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                rangeKey === r.key
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground hover:bg-sidebar-bg'
              }`}
            >
              {r.label}
            </button>
          ))}
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

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {(statsError || entriesError) && !isLoading && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Failed to load sleep data. The backend may need to be restarted.
        </div>
      )}

      {!isLoading && !(statsError || entriesError) && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Avg Sleep Duration"
              value={stats?.avgSleepHours?.toFixed(1) ?? '0'}
              unit="hrs"
              icon={Moon01}
            />
            <StatCard
              label="Avg Quality"
              value={stats?.avgQuality?.toFixed(1) ?? '0'}
              unit="/ 10"
              icon={Star01}
            />
            <StatCard
              label="Avg Interruptions"
              value={stats?.avgInterruptions?.toFixed(1) ?? '0'}
              unit="/ night"
              icon={AlertCircle}
            />
            <StatCard
              label="Avg Latency"
              value={stats?.avgLatency?.toFixed(0) ?? '0'}
              unit="min"
              icon={Hourglass01}
            />
          </div>

          {chartData.length > 0 && (
            <div className="rounded-lg border border-card-border bg-card-bg p-4">
              <h3 className="font-semibold text-foreground mb-4">Sleep Duration Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis domain={[0, 12]} tick={{ fontSize: 11, fill: 'var(--muted)' }} unit="h" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      dot={{ fill: '#7c3aed', r: 3 }}
                      name="Hours Slept"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="rounded-lg border border-card-border bg-card-bg p-4">
              <h3 className="font-semibold text-foreground mb-4">Sleep Quality Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="quality" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Quality" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {stagesData.length > 0 && (
            <div className="rounded-lg border border-card-border bg-card-bg p-4">
              <h3 className="font-semibold text-foreground mb-2">Sleep Stages (Last 7 Nights)</h3>
              <div className="flex items-center gap-4 mb-4">
                {Object.entries(STAGE_COLORS).map(([stage, color]) => (
                  <div key={stage} className="flex items-center gap-1.5">
                    <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
                    <span className="text-xs text-muted capitalize">{stage}</span>
                  </div>
                ))}
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stagesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--muted)' }} unit="m" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card-bg)',
                        border: '1px solid var(--card-border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      formatter={(value, name) => [`${value} min`, String(name)]}
                    />
                    <Bar dataKey="light" stackId="stages" fill={STAGE_COLORS.light} name="Light" />
                    <Bar dataKey="deep" stackId="stages" fill={STAGE_COLORS.deep} name="Deep" />
                    <Bar dataKey="rem" stackId="stages" fill={STAGE_COLORS.rem} name="REM" />
                    <Bar dataKey="awake" stackId="stages" fill={STAGE_COLORS.awake} name="Awake" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {entries.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-foreground">Recent Entries</h3>
              {[...entries]
                .sort((a, b) => b.date.localeCompare(a.date))
                .filter((entry) => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  const dateStr = format(parseISO(entry.date), 'EEEE, MMMM d').toLowerCase();
                  const notes = (entry.notes ?? '').toLowerCase();
                  return dateStr.includes(q) || notes.includes(q);
                })
                .slice(0, 10)
                .map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/sleep/log?date=${entry.date}`}
                    className="block rounded-lg border border-card-border bg-card-bg p-4 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-sm font-semibold text-foreground">
                            {format(parseISO(entry.date), 'EEEE, MMMM d')}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {(entry.totalMinutes / 60).toFixed(1)}h slept
                          </span>
                          <span>Quality: {entry.sleepQuality}/10</span>
                          {entry.interruptions?.length > 0 && (
                            <span>{entry.interruptions.length} interruption{entry.interruptions.length !== 1 ? 's' : ''}</span>
                          )}
                        </div>
                      </div>
                      <QualityDots quality={entry.sleepQuality} />
                    </div>
                  </Link>
                ))}
            </div>
          )}

          {entries.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-card-border bg-card-bg py-20">
              <Moon01 className="h-12 w-12 text-muted-light mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-1">No sleep entries yet</h2>
              <p className="text-sm text-muted mb-6">Start logging your sleep to see trends and insights.</p>
              <Link
                href="/sleep/log"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                Log First Night
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
