'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, ChevronLeft, ChevronRight } from '@untitled-ui/icons-react';
import { metricsApi } from '@/lib/api/metrics';
import type { BodyMetric, MetricType } from '@/types/metrics';

import { METRIC_LABELS } from '@/types/metrics';

const METRIC_OPTIONS: { key: MetricType | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All Types' },
  ...Object.entries(METRIC_LABELS).map(([key, label]) => ({ key: key as MetricType, label })),
];

const PAGE_SIZE = 20;

export default function BodyMetricsHistoryPage() {
  const [metricFilter, setMetricFilter] = useState<MetricType | 'ALL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);

  const params: Record<string, string> = {};
  if (metricFilter !== 'ALL') params.metric_type = metricFilter;
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;

  const { data: allMetrics, isLoading } = useQuery({
    queryKey: ['metrics-history', metricFilter, dateFrom, dateTo],
    queryFn: () => metricsApi.list(params),
  });

  const sortedMetrics = useMemo(() => {
    if (!allMetrics) return [];
    const sorted = [...allMetrics].sort((a, b) => {
      const da = new Date(a.measuredAt).getTime();
      const db = new Date(b.measuredAt).getTime();
      return sortAsc ? da - db : db - da;
    });
    return sorted;
  }, [allMetrics, sortAsc]);

  const totalPages = Math.ceil(sortedMetrics.length / PAGE_SIZE);
  const pageMetrics = sortedMetrics.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/body-metrics"
          className="rounded-md p-1.5 text-muted hover:bg-card-border/50 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Measurement History</h1>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-card-border bg-card-bg p-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Metric Type</label>
          <select
            value={metricFilter}
            onChange={(e) => { setMetricFilter(e.target.value as MetricType | 'ALL'); setPage(0); }}
            className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          >
            {METRIC_OPTIONS.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <button
          onClick={() => setSortAsc((prev) => !prev)}
          className="rounded-lg border border-card-border px-3 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          Sort: {sortAsc ? 'Oldest First' : 'Newest First'}
        </button>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : pageMetrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-sidebar-bg">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">Value</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted">Unit</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted">Notes</th>
                </tr>
              </thead>
              <tbody>
                {pageMetrics.map((m) => (
                  <tr key={m.id} className="border-b border-card-border last:border-0 hover:bg-sidebar-bg/30">
                    <td className="px-4 py-2.5 text-foreground">
                      {format(parseISO(m.measuredAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {m.customName ?? m.metricType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-medium text-foreground">
                      {m.value.toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-muted">{m.unit}</td>
                    <td className="px-4 py-2.5 text-muted text-xs max-w-[200px] truncate">
                      {m.notes ?? '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-sm text-muted">
            No measurements found
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, sortedMetrics.length)} of {sortedMetrics.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg border border-card-border p-2 text-muted hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg border border-card-border p-2 text-muted hover:text-foreground disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
