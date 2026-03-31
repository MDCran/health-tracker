'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Plus,
  Star01,
  ChevronLeft,
  ChevronRight,
  Edit01,
  SearchSm,
} from '@untitled-ui/icons-react';
import { journalApi } from '@/lib/api/journal';
import { REALMS } from '@/types/journal';
import type { JournalEntry, RealmAverage } from '@/types/journal';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

function StarRating({ rating }: { rating: number | null }) {
  const stars = rating ?? 0;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star01
          key={i}
          className={`h-4 w-4 ${i <= stars ? 'text-warning fill-warning' : 'text-muted-light/30'}`}
        />
      ))}
    </div>
  );
}

function RealmMiniBars({ ratings }: { ratings: JournalEntry['realmRatings'] }) {
  return (
    <div className="flex gap-0.5">
      {REALMS.map((realm) => {
        const rating = ratings.find((r) => r.realm === realm.key);
        const value = rating?.rating ?? 0;
        const pct = (value / 10) * 100;
        return (
          <div key={realm.key} className="w-3" title={`${realm.label}: ${value}/10`}>
            <div className="h-5 w-full rounded-sm bg-sidebar-bg overflow-hidden relative">
              <div
                className="absolute bottom-0 w-full rounded-sm transition-all"
                style={{ height: `${pct}%`, backgroundColor: realm.color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function JournalPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const params: Record<string, string> = {
    page: String(page),
    size: '10',
  };
  if (dateFrom) params.from = dateFrom;
  if (dateTo) params.to = dateTo;

  const { data, isLoading, error } = useQuery({
    queryKey: ['journal', page, dateFrom, dateTo],
    queryFn: () => journalApi.list(params),
  });

  const realmParams: Record<string, string> = {};
  if (dateFrom) realmParams.from = dateFrom;
  if (dateTo) realmParams.to = dateTo;

  const { data: realmAverages } = useQuery({
    queryKey: ['journal-realm-averages', dateFrom, dateTo],
    queryFn: () => journalApi.realmAverages(realmParams),
  });

  const allEntries = data?.content ?? [];
  const entries = allEntries.filter((entry: JournalEntry) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      entry.reflection?.toLowerCase().includes(q) ||
      entry.gratitude?.toLowerCase().includes(q) ||
      entry.date?.toLowerCase().includes(q)
    );
  });
  const totalPages = data?.totalPages ?? 0;

  const radarData = REALMS.map((realm) => {
    const avg = realmAverages?.find((r: RealmAverage) => r.realm === realm.key);
    return {
      realm: realm.label,
      value: avg?.averageRating ?? 0,
      fullMark: 10,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Journal</h1>
          <p className="text-sm text-muted">Reflect on your wellness across all realms of life</p>
        </div>
        <Link
          href="/journal/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Entry
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-card-border bg-card-bg p-4">
        <label className="text-sm font-medium text-muted">Filter:</label>
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

      {realmAverages && realmAverages.length > 0 && (
        <div className="rounded-lg border border-card-border bg-card-bg p-4">
          <h3 className="font-semibold text-foreground mb-2">Realm Averages</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="var(--card-border)" />
                <PolarAngleAxis dataKey="realm" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10, fill: 'var(--muted-light)' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Radar name="Average" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
          Failed to load journal entries.
        </div>
      )}

      {!isLoading && !error && entries.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-card-border bg-card-bg py-20">
          <Edit01 className="h-12 w-12 text-muted-light mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">No entries yet</h2>
          <p className="text-sm text-muted mb-6">Start journaling to track your wellness over time.</p>
          <Link
            href="/journal/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Write First Entry
          </Link>
        </div>
      )}

      {entries.length > 0 && (
        <div className="space-y-3">
          {entries.map((entry: JournalEntry) => (
            <Link
              key={entry.id}
              href={`/journal/${entry.date}`}
              className="block rounded-lg border border-card-border bg-card-bg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      {format(parseISO(entry.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <StarRating rating={entry.overallRating} />
                  </div>
                  {entry.reflection && (
                    <p className="text-sm text-muted line-clamp-2 mt-1">{entry.reflection}</p>
                  )}
                  {entry.gratitude && (
                    <p className="text-xs text-muted-light mt-1 italic truncate">Grateful for: {entry.gratitude}</p>
                  )}
                </div>
                <RealmMiniBars ratings={entry.realmRatings} />
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-card-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="inline-flex items-center gap-1 rounded-lg border border-card-border bg-card-bg px-3 py-1.5 text-sm font-medium text-foreground hover:bg-card-border/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
