'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  SearchSm,
  X,
  Zap,
  Target01,
  Heart,
  Moon01,
  Monitor01,
  Ruler,
  CalendarPlus01,
  File06,
  Shield01,
  Camera01,
  BookOpen01,
  MedicalCross,
  Activity,
} from '@untitled-ui/icons-react';
import { searchApi, type SearchResult } from '@/lib/api/search';

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  workouts: Zap,
  habits: Target01,
  nutrition: Heart,
  sleep: Moon01,
  vitals: Activity,
  body_metrics: Ruler,
  appointments: CalendarPlus01,
  medical_records: File06,
  substance_tracker: Shield01,
  progress_photos: Camera01,
  journal: BookOpen01,
  therapeutics: MedicalCross,
};

const CATEGORY_LABELS: Record<string, string> = {
  workouts: 'Workouts',
  habits: 'Habits',
  nutrition: 'Nutrition',
  sleep: 'Sleep',
  vitals: 'Vitals',
  body_metrics: 'Body Metrics',
  appointments: 'Appointments',
  medical_records: 'Medical Records',
  substance_tracker: 'Substance Tracker',
  progress_photos: 'Progress Photos',
  journal: 'Journal',
  therapeutics: 'Therapeutics',
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
        setResults([]);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const doSearch = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      searchApi.search(q.trim(), 30)
        .then((data) => { setResults(data.results); setSelectedIndex(0); })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);
  }, []);

  useEffect(() => { doSearch(query); }, [query, doSearch]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex]);
    }
  }

  function navigateTo(result: SearchResult) {
    setOpen(false);
    setQuery('');
    setResults([]);
    router.push(result.url);
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.category] ??= []).push(r);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md mx-auto">
      <div
        className={`flex items-center gap-2 rounded-xl border transition-all ${
          open
            ? 'border-primary ring-2 ring-primary/20 bg-background'
            : 'border-card-border bg-sidebar-bg hover:border-muted-light/40 cursor-pointer'
        } px-3 py-1.5`}
        onClick={() => { if (!open) { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); } }}
      >
        <SearchSm className="h-4 w-4 text-muted shrink-0" />
        {open ? (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search everything..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-light outline-none ring-0 shadow-none border-none focus:ring-0 focus:shadow-none focus:border-none focus:outline-none"
            style={{ boxShadow: 'none' }}
            autoFocus
          />
        ) : (
          <span className="flex-1 text-[13px] text-muted-light">Search...</span>
        )}
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-card-border bg-background px-1.5 py-0.5 text-[10px] text-muted-light font-mono">
          &#8984;K
        </kbd>
        {open && query && (
          <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="p-0.5 text-muted hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && (query.trim().length > 0) && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[420px] overflow-y-auto rounded-xl border border-card-border bg-card-bg shadow-lg z-50 animate-fade-in">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}

          {!loading && results.length === 0 && query.trim().length > 1 && (
            <div className="px-4 py-8 text-center">
              <SearchSm className="mx-auto mb-2 h-5 w-5 text-muted-light/50" />
              <p className="text-[13px] text-muted">No results for &quot;{query}&quot;</p>
            </div>
          )}

          {!loading && Object.entries(grouped).map(([category, items]) => {
            const Icon = CATEGORY_ICONS[category] ?? SearchSm;
            const label = CATEGORY_LABELS[category] ?? category;

            return (
              <div key={category}>
                <div className="sticky top-0 bg-card-bg/95 backdrop-blur-sm px-3 py-1.5 border-b border-card-border/50">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-light">{label}</span>
                </div>
                {items.map((item) => {
                  flatIndex++;
                  const isSelected = flatIndex === selectedIndex;
                  const currentIndex = flatIndex;
                  return (
                    <button
                      key={`${item.category}-${item.id}`}
                      onClick={() => navigateTo(item)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        isSelected ? 'bg-primary/8 text-foreground' : 'text-foreground hover:bg-sidebar-bg'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium truncate">{item.title}</p>
                        {item.subtitle && (
                          <p className="text-[11px] text-muted-light truncate">{item.subtitle}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
