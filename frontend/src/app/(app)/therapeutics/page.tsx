'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { peptideApi, medicationApi, supplementApi } from '@/lib/api/therapeutics';
import type { Peptide, Medication, Supplement, TherapeuticType } from '@/types/therapeutic';
import {
  Plus,
  SearchSm,
  Edit01,
  ClipboardCheck,
  AlertCircle,
} from '@untitled-ui/icons-react';

type TabFilter = 'ALL' | TherapeuticType;

const TAB_OPTIONS: { label: string; value: TabFilter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Injectables', value: 'PEPTIDE' },
  { label: 'Medications', value: 'MEDICATION' },
  { label: 'Supplements', value: 'SUPPLEMENT' },
];

const BADGE_STYLES: Record<TherapeuticType, string> = {
  PEPTIDE: 'bg-purple/10 text-purple',
  MEDICATION: 'bg-info/10 text-info',
  SUPPLEMENT: 'bg-success/10 text-success',
};

const BADGE_LABELS: Record<TherapeuticType, string> = {
  PEPTIDE: 'Injectable',
  MEDICATION: 'Medication',
  SUPPLEMENT: 'Supplement',
};

interface UnifiedTherapeutic {
  id: number;
  name: string;
  type: TherapeuticType;
  dosage: string;
  frequency: string;
  active: boolean;
}

function normalizePeptide(p: Peptide): UnifiedTherapeutic {
  return {
    id: p.id,
    name: p.name,
    type: 'PEPTIDE',
    dosage: p.totalAmountMg ? `${p.totalAmountMg} mg` : '--',
    frequency: '--',
    active: p.active,
  };
}

function normalizeMedication(m: Medication): UnifiedTherapeutic {
  return {
    id: m.id,
    name: m.name,
    type: 'MEDICATION',
    dosage:
      m.dosageAmount != null
        ? `${m.dosageAmount} ${m.dosageUnit || ''}`
        : '--',
    frequency: m.frequency || '--',
    active: m.active,
  };
}

function normalizeSupplement(s: Supplement): UnifiedTherapeutic {
  return {
    id: s.id,
    name: s.name,
    type: 'SUPPLEMENT',
    dosage:
      s.dosageAmount != null
        ? `${s.dosageAmount} ${s.dosageUnit || ''}`
        : '--',
    frequency: s.frequency || '--',
    active: s.active,
  };
}

export default function TherapeuticsPage() {
  const [tab, setTab] = useState<TabFilter>('ALL');
  const [search, setSearch] = useState('');

  const { data: peptides, isLoading: loadingP } = useQuery({
    queryKey: ['peptides'],
    queryFn: () => peptideApi.list(),
  });
  const { data: medications, isLoading: loadingM } = useQuery({
    queryKey: ['medications'],
    queryFn: () => medicationApi.list(),
  });
  const { data: supplements, isLoading: loadingS } = useQuery({
    queryKey: ['supplements'],
    queryFn: () => supplementApi.list(),
  });

  const isLoading = loadingP || loadingM || loadingS;

  const allItems = useMemo(() => {
    const items: UnifiedTherapeutic[] = [
      ...(peptides?.map(normalizePeptide) ?? []),
      ...(medications?.map(normalizeMedication) ?? []),
      ...(supplements?.map(normalizeSupplement) ?? []),
    ];
    return items;
  }, [peptides, medications, supplements]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (tab !== 'ALL') {
      items = items.filter((i) => i.type === tab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [allItems, tab, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-foreground">Therapeutics</h1>
        <Link
          href="/therapeutics/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          <Plus className="h-4 w-4" />
          Add New
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-card-border bg-card-bg p-1">
          {TAB_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTab(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                tab === opt.value
                  ? 'bg-primary text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <SearchSm className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search therapeutics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary sm:w-64"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-lg border border-card-border bg-card-bg"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card-bg py-16 text-center">
          <AlertCircle className="h-10 w-10 text-muted-light" />
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            No therapeutics found
          </h3>
          <p className="mt-1 text-xs text-muted">
            {search
              ? 'Try adjusting your search'
              : 'Add your first therapeutic to get started'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-card-border">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-card-border bg-sidebar-bg">
                <th className="px-4 py-3 font-medium text-muted">Name</th>
                <th className="px-4 py-3 font-medium text-muted">Type</th>
                <th className="px-4 py-3 font-medium text-muted">Dosage</th>
                <th className="px-4 py-3 font-medium text-muted">Frequency</th>
                <th className="px-4 py-3 font-medium text-muted">Status</th>
                <th className="px-4 py-3 font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border bg-card-bg">
              {filtered.map((item) => (
                <tr key={`${item.type}-${item.id}`} className="hover:bg-sidebar-bg/50">
                  <td className="px-4 py-3 font-medium text-foreground">
                    <Link
                      href={`/therapeutics/${item.id}?type=${item.type}`}
                      className="hover:text-primary"
                    >
                      {item.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_STYLES[item.type]}`}
                    >
                      {BADGE_LABELS[item.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.dosage}</td>
                  <td className="px-4 py-3 text-muted">{item.frequency}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.active
                          ? 'bg-success/10 text-success'
                          : 'bg-muted-light/10 text-muted-light'
                      }`}
                    >
                      {item.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/therapeutics/${item.id}?type=${item.type}`}
                        className="rounded-md p-1.5 text-muted hover:bg-card-border/50 hover:text-foreground"
                        title="Edit"
                      >
                        <Edit01 className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/therapeutics/${item.id}?type=${item.type}`}
                        className="rounded-md p-1.5 text-muted hover:bg-primary/10 hover:text-primary"
                        title="Log intake"
                      >
                        <ClipboardCheck className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
