'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '@/lib/api/journal';
import { REALMS } from '@/types/journal';
import { ArrowLeft, Trash01, Edit01 } from '@untitled-ui/icons-react';
import Link from 'next/link';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer,
} from 'recharts';

export default function JournalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const date = params.id as string;

  const { data: entry, isLoading } = useQuery({
    queryKey: ['journal', date],
    queryFn: () => journalApi.get(date),
  });

  const deleteMutation = useMutation({
    mutationFn: () => journalApi.delete(date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal'] });
      router.push('/journal');
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center py-20 text-muted">Loading...</div>;
  }

  if (!entry) {
    return <div className="flex items-center justify-center py-20 text-muted">Entry not found</div>;
  }

  const radarData = REALMS.map((r) => {
    const rating = entry.realmRatings?.find((rr) => rr.realm === r.key);
    return { realm: r.label, value: rating?.rating ?? 0, fullMark: 10 };
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/journal" className="rounded-md p-1 text-muted hover:bg-card-border/50">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Journal Entry</h1>
            <p className="text-sm text-muted">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/journal/new?date=${date}`}
            className="rounded-lg border border-card-border px-3 py-2 text-sm text-muted hover:bg-card-border/50"
          >
            <Edit01 className="h-4 w-4" />
          </Link>
          <button
            onClick={() => { if (confirm('Delete this entry?')) deleteMutation.mutate(); }}
            className="rounded-lg border border-danger/30 px-3 py-2 text-sm text-danger hover:bg-danger/10"
          >
            <Trash01 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {entry.overallRating && (
        <div className="mb-6 rounded-xl border border-card-border bg-card-bg p-4 text-center">
          <p className="text-sm text-muted mb-1">Overall Rating</p>
          <div className="flex items-center justify-center gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className={`h-3 w-3 rounded-full ${i < entry.overallRating! ? 'bg-primary' : 'bg-card-border'}`}
              />
            ))}
          </div>
          <p className="mt-1 text-lg font-bold text-foreground">{entry.overallRating}/10</p>
        </div>
      )}

      {entry.realmRatings && entry.realmRatings.length > 0 && (
        <div className="mb-6 rounded-xl border border-card-border bg-card-bg p-4">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Seven Realms</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="realm" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 10]} tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {REALMS.map((r) => {
              const rating = entry.realmRatings?.find((rr) => rr.realm === r.key);
              return (
                <div key={r.key} className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="text-xs text-muted">{r.label}</span>
                  <span className="ml-auto text-xs font-medium text-foreground">
                    {rating?.rating ?? '-'}/10
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {entry.reflection && (
        <div className="mb-4 rounded-xl border border-card-border bg-card-bg p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Reflection</h2>
          <p className="whitespace-pre-wrap text-sm text-muted">{entry.reflection}</p>
        </div>
      )}

      {entry.gratitude && (
        <div className="mb-4 rounded-xl border border-card-border bg-card-bg p-4">
          <h2 className="mb-2 text-sm font-semibold text-foreground">Gratitude</h2>
          <p className="whitespace-pre-wrap text-sm text-muted">{entry.gratitude}</p>
        </div>
      )}
    </div>
  );
}
