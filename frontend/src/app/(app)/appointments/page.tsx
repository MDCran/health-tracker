'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { Plus, Clock, MarkerPin01, Trash01, Edit05, MedicalCross, SearchSm } from '@untitled-ui/icons-react';
import { appointmentsApi, type Appointment } from '@/lib/api/appointments';

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: 'bg-info/10 text-info',
  COMPLETED: 'bg-success/10 text-success',
  CANCELLED: 'bg-danger/10 text-danger',
  RESCHEDULED: 'bg-warning/10 text-warning',
};

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: appointments, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => appointmentsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => appointmentsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const filtered = appointments?.filter((a) => {
    if (filter === 'upcoming') return !isPast(parseISO(a.appointmentDate)) || isToday(parseISO(a.appointmentDate));
    if (filter === 'past') return isPast(parseISO(a.appointmentDate)) && !isToday(parseISO(a.appointmentDate));
    return true;
  })?.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.doctorName?.toLowerCase().includes(q) ||
      a.officeName?.toLowerCase().includes(q) ||
      a.specialty?.toLowerCase().includes(q) ||
      a.notes?.toLowerCase().includes(q)
    );
  }) ?? [];

  const sorted = [...filtered].sort((a, b) => {
    if (filter === 'past') return b.appointmentDate.localeCompare(a.appointmentDate);
    return a.appointmentDate.localeCompare(b.appointmentDate);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Appointments</h1>
          <p className="text-sm text-muted">Schedule and track medical appointments</p>
        </div>
        <Link
          href="/appointments/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Appointment
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 rounded-lg border border-card-border bg-card-bg p-1 w-fit">
        {(['upcoming', 'past', 'all'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
              filter === f ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
            }`}
          >
            {f}
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

      {!isLoading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-card-border bg-card-bg py-20">
          <MedicalCross className="h-12 w-12 text-muted-light mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">No appointments</h2>
          <p className="text-sm text-muted mb-6">Schedule your first appointment to get started.</p>
          <Link
            href="/appointments/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" /> Schedule Appointment
          </Link>
        </div>
      )}

      {!isLoading && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((apt) => (
            <div
              key={apt.id}
              className="rounded-lg border border-card-border bg-card-bg p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground truncate">{apt.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[apt.status] || 'bg-muted-light/10 text-muted'}`}>
                      {apt.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(apt.appointmentDate), 'EEE, MMM d, yyyy')}
                      {apt.appointmentTime && ` at ${apt.appointmentTime.substring(0, 5)}`}
                    </span>
                    {apt.doctorName && (
                      <span className="flex items-center gap-1">
                        <MedicalCross className="h-3 w-3" />
                        {apt.doctorName}
                      </span>
                    )}
                    {apt.location && (
                      <span className="flex items-center gap-1">
                        <MarkerPin01 className="h-3 w-3" />
                        {apt.location}
                      </span>
                    )}
                  </div>

                  {(apt.specialty || apt.officeName) && (
                    <div className="flex gap-2 mt-1.5">
                      {apt.specialty && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{apt.specialty}</span>
                      )}
                      {apt.officeName && (
                        <span className="text-[10px] text-muted">{apt.officeName}</span>
                      )}
                    </div>
                  )}

                  {apt.notes && (
                    <p className="text-xs text-muted mt-2 line-clamp-2">{apt.notes}</p>
                  )}
                </div>

                <div className="flex gap-1 shrink-0">
                  <Link
                    href={`/appointments/new?edit=${apt.id}`}
                    className="rounded-md p-1.5 text-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Edit05 className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    onClick={() => { if (confirm('Delete this appointment?')) deleteMutation.mutate(apt.id); }}
                    className="rounded-md p-1.5 text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash01 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
