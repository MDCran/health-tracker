'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Plus,
  Image01,
  ChevronLeft,
  ChevronRight,
  Upload01,
  SearchSm,
} from '@untitled-ui/icons-react';
import { photosApi } from '@/lib/api/photos';
import type { ProgressPhoto, MetricsSnapshot } from '@/types/photo';

function getAuthImageUrl(photoId: number): string {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return photosApi.imageUrl(photoId) + (token ? `?token=${token}` : '');
}

export default function ProgressPhotosPage() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  const { data: photos, isLoading } = useQuery({
    queryKey: ['progress-photos'],
    queryFn: () => photosApi.list(),
  });

  const chronological = photos ? [...photos].reverse() : [];

  useEffect(() => {
    if (chronological.length > 0 && selectedIndex >= chronological.length) {
      setSelectedIndex(0);
    }
  }, [chronological.length, selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (chronological.length === 0) return;
      if (e.key === 'ArrowRight') {
        setSelectedIndex((i) => Math.min(i + 1, chronological.length - 1));
      }
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
    },
    [chronological.length]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!thumbnailStripRef.current) return;
    const strip = thumbnailStripRef.current;
    const thumb = strip.children[selectedIndex] as HTMLElement | undefined;
    if (thumb) {
      thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedIndex]);

  const currentPhoto =
    chronological.length > 0 ? chronological[selectedIndex] : null;

  const currentMetrics: MetricsSnapshot = currentPhoto?.metricsSnapshot
    ? JSON.parse(currentPhoto.metricsSnapshot)
    : {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Progress Photos</h1>
          <p className="text-sm text-muted">
            {photos
              ? `${photos.length} photo${photos.length !== 1 ? 's' : ''}`
              : 'Track your visual progress over time'}
          </p>
        </div>
        <Link
          href="/progress-photos/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Upload Photo
        </Link>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && (!photos || photos.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card-bg py-20">
          <Image01 className="h-12 w-12 text-muted-light mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">
            No progress photos yet
          </h2>
          <p className="text-sm text-muted mb-6">
            Upload your first photo to start tracking visual progress.
          </p>
          <Link
            href="/progress-photos/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Upload01 className="h-4 w-4" />
            Upload First Photo
          </Link>
        </div>
      )}

      {chronological.length > 0 && (
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
      )}

      {chronological.length > 0 && currentPhoto && (
        <div className="rounded-xl border border-card-border bg-card-bg overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            <div className="relative flex-1 flex items-center justify-center bg-black/5 dark:bg-black/20 min-h-[400px] lg:min-h-[500px]">
              <button
                onClick={() => setSelectedIndex((i) => Math.max(i - 1, 0))}
                disabled={selectedIndex === 0}
                className="cursor-pointer absolute left-3 z-10 rounded-full border border-card-border bg-card-bg/90 p-2 text-foreground shadow-sm hover:bg-card-bg disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <img
                src={getAuthImageUrl(currentPhoto.id)}
                alt={`Progress photo from ${format(new Date(currentPhoto.takenAt), 'MMMM d, yyyy')}`}
                className="max-h-[480px] max-w-full object-contain p-4"
              />

              <button
                onClick={() =>
                  setSelectedIndex((i) =>
                    Math.min(i + 1, chronological.length - 1)
                  )
                }
                disabled={selectedIndex === chronological.length - 1}
                className="cursor-pointer absolute right-3 z-10 rounded-full border border-card-border bg-card-bg/90 p-2 text-foreground shadow-sm hover:bg-card-bg disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs text-white tabular-nums">
                {selectedIndex + 1} / {chronological.length}
              </div>
            </div>

            <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-card-border p-5 space-y-4 overflow-y-auto max-h-[500px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Date
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {format(new Date(currentPhoto.takenAt), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>

              {currentPhoto.weightKg != null && (
                <div className="rounded-lg border border-card-border bg-background p-3">
                  <p className="text-xs text-muted">Weight</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">
                    {currentPhoto.weightKg} kg
                  </p>
                </div>
              )}

              {Object.keys(currentMetrics).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Measurements
                  </p>
                  {Object.entries(currentMetrics).map(
                    ([key, value]) =>
                      value != null && (
                        <div
                          key={key}
                          className="flex items-center justify-between rounded-lg border border-card-border bg-background px-3 py-2"
                        >
                          <span className="text-xs text-muted capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-sm font-medium tabular-nums text-foreground">
                            {value}&quot;
                          </span>
                        </div>
                      )
                  )}
                </div>
              )}

              {currentPhoto.notes && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Notes
                  </p>
                  <p className="text-sm text-foreground leading-relaxed">
                    {currentPhoto.notes}
                  </p>
                </div>
              )}

              {currentPhoto.workoutSessionId && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                  <p className="text-xs text-primary font-medium">
                    Linked to workout #{currentPhoto.workoutSessionId}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-card-border px-4 py-3 space-y-2">
            <input
              type="range"
              min={0}
              max={chronological.length - 1}
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="w-full accent-primary h-1.5"
            />
            <div className="flex justify-between text-[10px] text-muted tabular-nums">
              <span>
                {chronological.length > 0
                  ? format(new Date(chronological[0].takenAt), 'MMM d, yyyy')
                  : ''}
              </span>
              <span>
                {chronological.length > 0
                  ? format(
                      new Date(
                        chronological[chronological.length - 1].takenAt
                      ),
                      'MMM d, yyyy'
                    )
                  : ''}
              </span>
            </div>
          </div>

          <div className="border-t border-card-border">
            <div
              ref={thumbnailStripRef}
              className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-thin"
            >
              {chronological.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedIndex(idx)}
                  className={`cursor-pointer relative shrink-0 h-16 w-16 rounded-md overflow-hidden transition-all ${
                    idx === selectedIndex
                      ? 'ring-2 ring-primary ring-offset-1 ring-offset-card-bg scale-105'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={getAuthImageUrl(photo.id)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {chronological.length > 0 && (() => {
        const filteredPhotos = chronological.filter((photo) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            photo.notes?.toLowerCase().includes(q) ||
            (photo.weightKg != null && String(photo.weightKg).includes(q))
          );
        });
        const grouped: { date: string; photos: { photo: ProgressPhoto; globalIdx: number }[] }[] = [];
        filteredPhotos.forEach((photo) => {
          const globalIdx = chronological.indexOf(photo);
          const dateKey = format(new Date(photo.takenAt), 'yyyy-MM-dd');
          const existing = grouped.find((g) => g.date === dateKey);
          if (existing) {
            existing.photos.push({ photo, globalIdx });
          } else {
            grouped.push({ date: dateKey, photos: [{ photo, globalIdx }] });
          }
        });

        return (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-foreground">All Photos</h2>
            {grouped.map((group) => (
              <div key={group.date}>
                <h3 className="text-base font-semibold text-foreground mb-3">
                  {format(new Date(group.date + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {group.photos.map(({ photo, globalIdx }) => (
                    <button
                      key={photo.id}
                      onClick={() => {
                        setSelectedIndex(globalIdx);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="cursor-pointer group relative aspect-square overflow-hidden rounded-lg border border-card-border bg-card-bg transition-shadow hover:shadow-md"
                    >
                      <img
                        src={getAuthImageUrl(photo.id)}
                        alt=""
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      {photo.weightKg != null && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5">
                          <p className="text-[10px] text-white/70 tabular-nums">
                            {photo.weightKg} kg
                          </p>
                        </div>
                      )}
                      {globalIdx === selectedIndex && (
                        <div className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white" />
                      )}
                      {photo.workoutSessionId && (
                        <div className="absolute top-1.5 left-1.5 rounded bg-primary/80 px-1 py-0.5 text-[9px] font-medium text-white">
                          Workout
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
