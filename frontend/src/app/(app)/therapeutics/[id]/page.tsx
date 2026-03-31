'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  peptideApi,
  medicationApi,
  supplementApi,
  scheduleApi,
  therapeuticLogApi,
} from '@/lib/api/therapeutics';
import type {
  Peptide,
  Medication,
  Supplement,
  TherapeuticType,
  TherapeuticSchedule,
  TherapeuticLog,
  ReconstitutionData,
} from '@/types/therapeutic';
import { ArrowLeft, Check, AlertCircle } from '@untitled-ui/icons-react';
import { format, parseISO } from 'date-fns';

const BADGE_STYLES: Record<TherapeuticType, string> = {
  PEPTIDE: 'bg-purple/10 text-purple',
  MEDICATION: 'bg-info/10 text-info',
  SUPPLEMENT: 'bg-success/10 text-success',
};

const BADGE_LABELS: Record<TherapeuticType, string> = {
  PEPTIDE: 'Peptide',
  MEDICATION: 'Medication',
  SUPPLEMENT: 'Supplement',
};

const DAY_NAMES: Record<number, string> = {
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
  7: 'Sun',
};

function ReconstitutionCard({ data }: { data: ReconstitutionData }) {
  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        Reconstitution Calculator
      </h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-sidebar-bg p-3">
          <p className="text-xs text-muted">Concentration</p>
          <p className="text-lg font-bold text-foreground">
            {data.concentrationMgPerMl.toFixed(2)}{' '}
            <span className="text-xs font-normal text-muted">mg/ml</span>
          </p>
        </div>
        <div className="rounded-lg bg-sidebar-bg p-3">
          <p className="text-xs text-muted">Per Unit (100 IU syringe)</p>
          <p className="text-lg font-bold text-foreground">
            {data.concentrationMcgPerUnit.toFixed(1)}{' '}
            <span className="text-xs font-normal text-muted">mcg/unit</span>
          </p>
        </div>
      </div>
      {data.compounds.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-muted">
            Per-Compound Breakdown
          </p>
          <div className="space-y-1">
            {data.compounds.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-sidebar-bg px-3 py-2 text-sm"
              >
                <span className="text-foreground">{c.compoundName}</span>
                <span className="text-muted">
                  {c.amountMg} mg ({c.concentrationMgPerMl.toFixed(3)} mg/ml)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleDisplay({ schedules }: { schedules: TherapeuticSchedule[] }) {
  if (schedules.length === 0) {
    return (
      <div className="rounded-xl border border-card-border bg-card-bg p-4">
        <h3 className="mb-2 text-sm font-semibold text-foreground">Schedule</h3>
        <p className="text-sm text-muted">No schedule configured.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card-bg p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Schedule</h3>
      {schedules.map((s) => (
        <div key={s.id} className="rounded-lg bg-sidebar-bg p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground capitalize">
              {s.scheduleType.toLowerCase().replace('_', ' ')}
            </span>
            {s.timeOfDay && (
              <span className="text-muted">at {s.timeOfDay}</span>
            )}
            <span
              className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${
                s.active
                  ? 'bg-success/10 text-success'
                  : 'bg-muted-light/10 text-muted-light'
              }`}
            >
              {s.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {s.daysOfWeek.length > 0 && (
            <p className="mt-1 text-xs text-muted">
              Days: {s.daysOfWeek.map((d) => DAY_NAMES[d] || d).join(', ')}
            </p>
          )}
          {s.intervalDays && (
            <p className="mt-1 text-xs text-muted">
              Every {s.intervalDays} day{s.intervalDays > 1 ? 's' : ''}
            </p>
          )}
          {s.dosageOverride != null && (
            <p className="mt-1 text-xs text-muted">
              Dosage: {s.dosageOverride} {s.dosageUnit || ''}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function TherapeuticDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = use(params);
  const id = Number(idStr);
  const searchParams = useSearchParams();
  const type = (searchParams.get('type') as TherapeuticType) || 'PEPTIDE';
  const queryClient = useQueryClient();

  const [logDate, setLogDate] = useState(
    new Date().toISOString().slice(0, 16),
  );
  const [logDosage, setLogDosage] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const { data: therapeutic, isLoading: loadingTherapeutic } = useQuery<
    Peptide | Medication | Supplement
  >({
    queryKey: ['therapeutic', type, id],
    queryFn: (): Promise<Peptide | Medication | Supplement> => {
      if (type === 'PEPTIDE') return peptideApi.get(id);
      if (type === 'MEDICATION') return medicationApi.get(id);
      return supplementApi.get(id);
    },
  });

  const { data: reconstitution } = useQuery<ReconstitutionData>({
    queryKey: ['reconstitution', id],
    queryFn: () => peptideApi.reconstitution(id),
    enabled: type === 'PEPTIDE',
  });

  const { data: schedules } = useQuery<TherapeuticSchedule[]>({
    queryKey: ['schedules', type, id],
    queryFn: () =>
      scheduleApi.list({
        therapeuticType: type,
        therapeuticId: String(id),
      }),
  });

  const { data: logs } = useQuery<TherapeuticLog[]>({
    queryKey: ['therapeutic-logs', type, id],
    queryFn: () =>
      therapeuticLogApi.list({
        therapeuticType: type,
        therapeuticId: String(id),
      }),
  });

  const logIntake = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      therapeuticLogApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['therapeutic-logs', type, id],
      });
      setLogDosage('');
      setLogNotes('');
    },
  });

  function handleLogSubmit(e: React.FormEvent) {
    e.preventDefault();
    logIntake.mutate({
      therapeuticType: type,
      therapeuticId: id,
      takenAt: new Date(logDate).toISOString(),
      dosageAmount: logDosage ? Number(logDosage) : null,
      dosageUnit: null,
      notes: logNotes.trim() || null,
      skipped: false,
    });
  }

  if (loadingTherapeutic) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-xl border border-card-border bg-card-bg"
          />
        ))}
      </div>
    );
  }

  if (!therapeutic) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-12 w-12 text-muted-light" />
        <h3 className="mt-4 text-lg font-semibold text-foreground">
          Therapeutic not found
        </h3>
        <Link href="/therapeutics" className="mt-2 text-sm text-primary hover:text-primary-dark">
          Back to list
        </Link>
      </div>
    );
  }

  const t = therapeutic as Peptide & Medication & Supplement;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/therapeutics"
          className="rounded-md p-1.5 text-muted hover:bg-card-border/50 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">{t.name}</h1>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[type]}`}
            >
              {BADGE_LABELS[type]}
            </span>
          </div>
          {t.notes && (
            <p className="mt-1 text-sm text-muted">{t.notes}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Details</h3>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {type === 'PEPTIDE' && (
            <>
              <div>
                <p className="text-xs text-muted">Total Amount</p>
                <p className="font-medium text-foreground">
                  {(t as Peptide).totalAmountMg ?? '--'} mg
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">BAC Water</p>
                <p className="font-medium text-foreground">
                  {(t as Peptide).bacWaterMl ?? '--'} ml
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Compounds</p>
                <p className="font-medium text-foreground">
                  {(t as Peptide).compounds?.length ?? 0}
                </p>
              </div>
            </>
          )}
          {(type === 'MEDICATION' || type === 'SUPPLEMENT') && (
            <>
              <div>
                <p className="text-xs text-muted">Dosage</p>
                <p className="font-medium text-foreground">
                  {t.dosageAmount != null
                    ? `${t.dosageAmount} ${t.dosageUnit || ''}`
                    : '--'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">Frequency</p>
                <p className="font-medium text-foreground">
                  {t.frequency || '--'}
                </p>
              </div>
            </>
          )}
          <div>
            <p className="text-xs text-muted">Status</p>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                t.active
                  ? 'bg-success/10 text-success'
                  : 'bg-muted-light/10 text-muted-light'
              }`}
            >
              {t.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted">Created</p>
            <p className="font-medium text-foreground">
              {format(parseISO(t.createdAt), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      </div>

      {type === 'PEPTIDE' && reconstitution && (
        <ReconstitutionCard data={reconstitution} />
      )}

      <ScheduleDisplay schedules={schedules ?? []} />

      <div className="rounded-xl border border-card-border bg-card-bg p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Log Intake
        </h3>
        <form onSubmit={handleLogSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={logDate}
                onChange={(e) => setLogDate(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Dosage
              </label>
              <input
                type="number"
                step="any"
                value={logDosage}
                onChange={(e) => setLogDosage(e.target.value)}
                className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Amount"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Notes
            </label>
            <input
              type="text"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Optional notes"
            />
          </div>
          <button
            type="submit"
            disabled={logIntake.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            {logIntake.isPending ? 'Logging...' : 'Mark as Taken'}
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Intake History
        </h3>
        {!logs || logs.length === 0 ? (
          <p className="text-sm text-muted">No intake logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="pb-2 pr-4 text-xs font-medium text-muted">
                    Date
                  </th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted">
                    Dosage
                  </th>
                  <th className="pb-2 pr-4 text-xs font-medium text-muted">
                    Status
                  </th>
                  <th className="pb-2 text-xs font-medium text-muted">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-4 text-foreground">
                      {format(parseISO(log.takenAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="py-2 pr-4 text-muted">
                      {log.dosageAmount != null
                        ? `${log.dosageAmount} ${log.dosageUnit || ''}`
                        : '--'}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          log.skipped
                            ? 'bg-warning/10 text-warning'
                            : 'bg-success/10 text-success'
                        }`}
                      >
                        {log.skipped ? 'Skipped' : 'Taken'}
                      </span>
                    </td>
                    <td className="py-2 text-muted">{log.notes || '--'}</td>
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
