'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, subMonths, subYears } from 'date-fns';
import { Plus, Trash01, AlertCircle, SearchSm } from '@untitled-ui/icons-react';
import { vitalsApi, VITAL_TYPES, type VitalReading } from '@/lib/api/vitals';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

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
    case '1M': return subMonths(now, 1).toISOString();
    case '3M': return subMonths(now, 3).toISOString();
    case '6M': return subMonths(now, 6).toISOString();
    case '1Y': return subYears(now, 1).toISOString();
    case 'ALL': return undefined;
  }
}

function getVitalLabel(type: string): string {
  return VITAL_TYPES.find(v => v.key === type)?.label ?? type;
}

function getVitalUnit(type: string): string {
  return VITAL_TYPES.find(v => v.key === type)?.unit ?? '';
}

function VitalChartCard({ vitalType, readings }: { vitalType: string; readings: VitalReading[] }) {
  const label = getVitalLabel(vitalType);
  const unit = getVitalUnit(vitalType);
  const isBP = vitalType === 'BLOOD_PRESSURE';

  const chartData = useMemo(() => {
    return [...readings]
      .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
      .map((r) => ({
        date: format(parseISO(r.measuredAt), 'MMM d'),
        value: r.value,
        ...(isBP && r.value2 != null ? { value2: r.value2 } : {}),
      }));
  }, [readings, isBP]);

  const latest = readings.length > 0 ? readings[0] : null;

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
        {latest && (
          <div className="text-right">
            <span className="text-lg font-bold tabular-nums text-foreground">
              {isBP ? `${latest.value}/${latest.value2}` : latest.value}
            </span>
            <span className="text-xs text-muted ml-1">{unit}</span>
          </div>
        )}
      </div>
      {chartData.length >= 1 ? (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'var(--muted)' }} axisLine={false} tickLine={false} domain={['auto', 'auto']}
              tickFormatter={(v: number) => Number.isInteger(v) ? String(v) : v.toFixed(1)} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }}
              formatter={(value) => [`${Number(value).toFixed(1)} ${unit}`, label]} />
            <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={2}
              dot={chartData.length <= 15 ? { r: 3, fill: 'var(--primary)' } : false}
              activeDot={{ r: 4 }} name={isBP ? 'Systolic' : label} />
            {isBP && <Line type="monotone" dataKey="value2" stroke="var(--info)" strokeWidth={2}
              dot={chartData.length <= 15 ? { r: 3, fill: 'var(--info)' } : false}
              activeDot={{ r: 4 }} name="Diastolic" />}
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-[160px] items-center justify-center text-xs text-muted">Not enough data yet</div>
      )}
    </div>
  );
}

export default function VitalsPage() {
  const queryClient = useQueryClient();
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');
  const [searchQuery, setSearchQuery] = useState('');
  const fromDate = getFromDate(timeRange);

  const { data: allReadings, isLoading } = useQuery({
    queryKey: ['vitals', timeRange],
    queryFn: () => vitalsApi.list(fromDate ? { from: fromDate, to: new Date().toISOString() } : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => vitalsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vitals'] }),
  });

  const groupedReadings = useMemo(() => {
    if (!allReadings) return new Map<string, VitalReading[]>();
    const map = new Map<string, VitalReading[]>();
    for (const r of allReadings) {
      const list = map.get(r.vitalType) ?? [];
      list.push(r);
      map.set(r.vitalType, list);
    }
    return map;
  }, [allReadings]);

  const allTypes = useMemo(() => {
    const logged = new Set(groupedReadings.keys());
    const standard = VITAL_TYPES.map(v => v.key);
    return [...new Set([...standard, ...logged])];
  }, [groupedReadings]);

  const typesWithData = allTypes.filter(t => (groupedReadings.get(t)?.length ?? 0) > 0);

  const recentReadings = useMemo(() => {
    if (!allReadings) return [];
    return [...allReadings].sort((a, b) => b.measuredAt.localeCompare(a.measuredAt)).slice(0, 30);
  }, [allReadings]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vitals</h1>
          <p className="text-sm text-muted">Track blood pressure, heart rate, SpO2, and more</p>
        </div>
        <Link href="/vitals/log"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
          <Plus className="h-4 w-4" /> Log Vitals
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 rounded-lg border border-card-border bg-card-bg p-1 w-fit">
        {RANGE_OPTIONS.map((opt) => (
          <button key={opt.value} onClick={() => setTimeRange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              timeRange === opt.value ? 'bg-primary text-white' : 'text-muted hover:text-foreground'}`}>
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

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && typesWithData.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-card-border bg-card-bg py-20">
          <AlertCircle className="h-12 w-12 text-muted-light mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">No vitals logged yet</h2>
          <p className="text-sm text-muted mb-6">Start tracking your vitals to see trends.</p>
          <Link href="/vitals/log"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors">
            <Plus className="h-4 w-4" /> Log First Reading
          </Link>
        </div>
      )}

      {!isLoading && typesWithData.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {typesWithData.map((type) => (
              <VitalChartCard key={type} vitalType={type} readings={groupedReadings.get(type) ?? []} />
            ))}
          </div>

          <div className="rounded-xl border border-card-border bg-card-bg p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Recent Readings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="pb-2 pr-4 text-xs font-medium text-muted">Date</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-muted">Vital</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-muted">Value</th>
                    <th className="pb-2 pr-4 text-xs font-medium text-muted">Notes</th>
                    <th className="pb-2 text-xs font-medium text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border">
                  {recentReadings.filter((r) => {
                    if (!searchQuery.trim()) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      getVitalLabel(r.vitalType).toLowerCase().includes(q) ||
                      r.notes?.toLowerCase().includes(q)
                    );
                  }).map((r) => {
                    const isBP = r.vitalType === 'BLOOD_PRESSURE';
                    return (
                      <tr key={r.id} className="hover:bg-sidebar-bg/50 transition-colors">
                        <td className="py-2 pr-4 text-foreground">{format(parseISO(r.measuredAt), 'MMM d, yyyy h:mm a')}</td>
                        <td className="py-2 pr-4 text-muted">{getVitalLabel(r.vitalType)}</td>
                        <td className="py-2 pr-4 font-medium text-foreground">
                          {isBP ? `${r.value}/${r.value2}` : r.value} <span className="text-xs text-muted">{getVitalUnit(r.vitalType)}</span>
                        </td>
                        <td className="py-2 pr-4 text-muted">{r.notes || '--'}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => deleteMutation.mutate(r.id)}
                            className="rounded-md px-2 py-1 text-xs text-danger hover:bg-danger/10 transition-colors">
                            <Trash01 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
