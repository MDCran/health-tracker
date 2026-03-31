'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { metricsApi } from '@/lib/api/metrics';
import { profileApi } from '@/lib/api/auth';
import type { BodyMetric, MetricType, MetricTrend } from '@/types/metrics';
import { MEASUREMENT_GROUPS, METRIC_LABELS, METRIC_UNITS } from '@/types/metrics';
import { Plus, AlertCircle, Trash01, Edit05, Check, XClose, SearchSm } from '@untitled-ui/icons-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, subMonths, subYears } from 'date-fns';

type GroupName = keyof typeof MEASUREMENT_GROUPS;
type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';
type UnitSystem = 'METRIC' | 'IMPERIAL';

const GROUP_NAMES = Object.keys(MEASUREMENT_GROUPS) as GroupName[];

function getDisplayUnit(metric: string, system: UnitSystem): string {
  const metricUnit = METRIC_UNITS[metric] || '';
  if (system === 'IMPERIAL' && metricUnit === 'kg') return 'lbs';
  return metricUnit;
}

function convertValue(value: number, metric: string, system: UnitSystem): number {
  if (system === 'METRIC') return value;
  const metricUnit = METRIC_UNITS[metric] || '';
  if (metricUnit === 'kg') return value * 2.20462;
  return value;
}

const RANGE_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: '1M', value: '1M' },
  { label: '3M', value: '3M' },
  { label: '6M', value: '6M' },
  { label: '1Y', value: '1Y' },
  { label: 'All', value: 'ALL' },
];

function getFromDate(range: TimeRange): string | undefined {
  const now = new Date();
  switch (range) {
    case '1M': return subMonths(now, 1).toISOString().split('T')[0];
    case '3M': return subMonths(now, 3).toISOString().split('T')[0];
    case '6M': return subMonths(now, 6).toISOString().split('T')[0];
    case '1Y': return subYears(now, 1).toISOString().split('T')[0];
    case 'ALL': return undefined;
  }
}


function MetricChartCard({ metricType, fromDate, unitSystem }: {
  metricType: MetricType;
  fromDate: string | undefined;
  unitSystem: UnitSystem;
}) {
  const label = METRIC_LABELS[metricType] || metricType;
  const unit = getDisplayUnit(metricType, unitSystem);

  const { data: trend, isLoading } = useQuery<MetricTrend | null>({
    queryKey: ['metric-trend', metricType, fromDate ?? 'ALL'],
    queryFn: () => metricsApi.trends({ metricType, ...(fromDate ? { from: fromDate } : {}) }),
  });

  const chartData = useMemo(() => {
    if (!trend?.dataPoints) return [];
    return trend.dataPoints.map((dp) => ({
      date: format(parseISO(dp.date), 'MMM d'),
      value: Math.round(convertValue(dp.value, metricType, unitSystem) * 10) / 10,
    }));
  }, [trend, metricType, unitSystem]);

  const current = chartData.length > 0 ? chartData[chartData.length - 1].value : null;
  const first = chartData.length > 1 ? chartData[0].value : null;
  const change = current !== null && first !== null ? current - first : null;

  if (isLoading) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-4">
        <div className="h-4 w-24 bg-sidebar-bg rounded animate-pulse mb-3" />
        <div className="h-[180px] bg-sidebar-bg rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        {current !== null && (
          <div className="text-right">
            <span className="text-lg font-bold tabular-nums text-foreground">
              {current.toFixed(1)}
            </span>
            <span className="text-xs text-muted ml-1">{unit}</span>
            {change !== null && Math.abs(change) > 0.01 && (
              <span className={`ml-2 text-xs font-medium ${change > 0 ? 'text-success' : 'text-danger'}`}>
                {change > 0 ? '+' : ''}{change.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
      {chartData.length >= 1 ? (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted)' }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value) => [`${Number(value).toFixed(1)} ${unit}`, label]}
            />
            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2}
              dot={chartData.length <= 10 ? { r: 3, fill: 'var(--primary)' } : false}
              activeDot={{ r: 4, fill: 'var(--primary)' }} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[180px] items-center justify-center text-xs text-muted">Not enough data yet</div>
      )}
    </div>
  );
}


export default function BodyMetricsPage() {
  const [selectedGroup, setSelectedGroup] = useState<GroupName>('Body Weight & Composition');
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({ queryKey: ['profile'], queryFn: () => profileApi.get() });
  const unitSystem: UnitSystem = (profile?.unitSystem as UnitSystem) || 'IMPERIAL';

  const groupMetrics = (MEASUREMENT_GROUPS[selectedGroup] ?? MEASUREMENT_GROUPS[GROUP_NAMES[0]]) as readonly string[];
  const fromDate = getFromDate(timeRange);

  const { data: allMetrics } = useQuery<BodyMetric[]>({
    queryKey: ['metrics-group', selectedGroup],
    queryFn: async () => {
      const results = await Promise.all(
        groupMetrics.map((mt) => metricsApi.list({ metricType: mt }))
      );
      return results.flat();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => metricsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['metrics-group'] });
      queryClient.invalidateQueries({ queryKey: ['metric-trend'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) =>
      metricsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
      queryClient.invalidateQueries({ queryKey: ['metrics-group'] });
      queryClient.invalidateQueries({ queryKey: ['metric-trend'] });
      setEditingId(null);
    },
  });

  const sortedMetrics = useMemo(() => {
    if (!allMetrics) return [];
    return [...allMetrics].sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
  }, [allMetrics]);

  function handleGroupChange(group: GroupName) {
    setSelectedGroup(group);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Body Metrics</h1>
        <Link
          href="/body-metrics/entry"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          New Measurement
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between flex-wrap">
        <div className="flex flex-wrap gap-1 rounded-lg border border-card-border bg-card-bg p-1">
          {GROUP_NAMES.map((group) => (
            <button
              key={group}
              onClick={() => handleGroupChange(group)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedGroup === group ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg border border-card-border bg-card-bg p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTimeRange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                timeRange === opt.value ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
              }`}
            >
              {opt.label}
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


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groupMetrics.map((metric) => (
          <MetricChartCard
            key={metric}
            metricType={metric as MetricType}
            fromDate={fromDate}
            unitSystem={unitSystem}
          />
        ))}
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Measurements</h3>
        {sortedMetrics.length === 0 ? (
          <p className="text-sm text-muted">No measurements recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="pb-2 pr-4 text-xs font-medium text-muted">Date</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted">Metric</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted">Value</th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted">Notes</th>
                  <th className="pb-2 text-xs font-medium text-muted text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {sortedMetrics.filter((m) => {
                  if (!searchQuery.trim()) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    (METRIC_LABELS[m.metricType] || m.metricType).toLowerCase().includes(q) ||
                    m.notes?.toLowerCase().includes(q)
                  );
                }).slice(0, 30).map((m) => (
                  <tr key={m.id} className="hover:bg-sidebar-bg/50 transition-colors">
                    <td className="py-2 pr-4 text-foreground">
                      {format(parseISO(m.measuredAt), 'MMM d, yyyy')}
                    </td>
                    <td className="py-2 pr-4 text-muted">
                      {METRIC_LABELS[m.metricType] || m.metricType}
                    </td>
                    <td className="py-2 pr-4 font-medium text-foreground">
                      {editingId === m.id ? (
                        <input
                          type="number"
                          step="any"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-20 rounded border border-card-border bg-background px-2 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <>
                          {convertValue(m.value, m.metricType, unitSystem).toFixed(1)}{' '}
                          <span className="text-xs font-normal text-muted">
                            {getDisplayUnit(m.metricType, unitSystem)}
                          </span>
                        </>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-muted">{m.notes || '--'}</td>
                    <td className="py-2 text-right">
                      {editingId === m.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              const numVal = Number(editValue);
                              if (!isNaN(numVal) && numVal > 0) {
                                const metricUnit = METRIC_UNITS[m.metricType] || '';
                                const storedVal = unitSystem === 'IMPERIAL' && metricUnit === 'kg'
                                  ? numVal / 2.20462 : numVal;
                                updateMutation.mutate({ id: m.id, data: { metricType: m.metricType, value: Math.round(storedVal * 100) / 100 } });
                              }
                            }}
                            className="rounded-md px-2 py-1 text-xs text-primary hover:bg-primary/10"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded-md px-2 py-1 text-xs text-muted hover:bg-card-border/50"
                          >
                            <XClose className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingId(m.id);
                              setEditValue(convertValue(m.value, m.metricType, unitSystem).toFixed(1));
                            }}
                            className="rounded-md px-2 py-1 text-xs text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Edit05 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(m.id)}
                            disabled={deleteMutation.isPending}
                            className="rounded-md px-2 py-1 text-xs text-danger hover:bg-danger/10 transition-colors"
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
        )}
      </div>
    </div>
  );
}
