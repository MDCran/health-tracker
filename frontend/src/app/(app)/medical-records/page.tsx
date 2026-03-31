'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
  Plus,
  File06,
  Trash01,
  X,
  MedicalCross,
  Calendar,
  User01,
  SearchSm,
} from '@untitled-ui/icons-react';
import { medicalRecordsApi, type MedicalRecord } from '@/lib/api/medical-records';

function getAuthFileUrl(recordId: number): string {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return medicalRecordsApi.fileUrl(recordId) + (token ? `?token=${token}` : '');
}

function isImage(mimeType: string | null): boolean {
  return mimeType != null && mimeType.startsWith('image/');
}

function isPdf(mimeType: string | null): boolean {
  return mimeType === 'application/pdf';
}

function formatFileSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType }: { mimeType: string | null }) {
  if (isImage(mimeType)) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-success" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="m21 15-5-5L5 21" />
        </svg>
      </div>
    );
  }
  if (isPdf(mimeType)) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-danger" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
      <File06 className="h-5 w-5 text-primary" />
    </div>
  );
}

export default function MedicalRecordsPage() {
  const queryClient = useQueryClient();
  const [previewRecord, setPreviewRecord] = useState<MedicalRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: records, isLoading } = useQuery({
    queryKey: ['medical-records'],
    queryFn: () => medicalRecordsApi.list(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => medicalRecordsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      setPreviewRecord(null);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medical Records</h1>
          <p className="text-sm text-muted">
            {records
              ? `${records.length} record${records.length !== 1 ? 's' : ''}`
              : 'Store and access your medical documents'}
          </p>
        </div>
        <Link
          href="/medical-records/upload"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="h-4 w-4" />
          Upload Record
        </Link>
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

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && (!records || records.length === 0) && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-card-border bg-card-bg py-20">
          <File06 className="h-12 w-12 text-muted-light mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-1">No medical records yet</h2>
          <p className="text-sm text-muted mb-6">Upload your first medical document to get started.</p>
          <Link
            href="/medical-records/upload"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            Upload First Record
          </Link>
        </div>
      )}

      {!isLoading && records && records.length > 0 && (() => {
        const filteredRecords = records.filter((record) => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            record.name?.toLowerCase().includes(q) ||
            record.providerName?.toLowerCase().includes(q) ||
            record.doctorName?.toLowerCase().includes(q) ||
            record.notes?.toLowerCase().includes(q)
          );
        });
        return filteredRecords.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="group rounded-xl border border-card-border bg-card-bg p-4 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setPreviewRecord(record)}
            >
              <div className="flex items-start gap-3">
                <FileTypeIcon mimeType={record.mimeType} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{record.name}</h3>
                  <div className="mt-1 space-y-0.5">
                    {record.providerName && (
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <MedicalCross className="h-3 w-3 shrink-0" />
                        <span className="truncate">{record.providerName}</span>
                      </p>
                    )}
                    {record.doctorName && (
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <User01 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{record.doctorName}</span>
                      </p>
                    )}
                    {record.recordDate && (
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {format(parseISO(record.recordDate), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this medical record?')) deleteMutation.mutate(record.id);
                  }}
                  className="rounded-md p-1.5 text-muted opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger/10 transition-all"
                >
                  <Trash01 className="h-3.5 w-3.5" />
                </button>
              </div>
              {record.fileSize != null && (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-light">
                  <span>{formatFileSize(record.fileSize)}</span>
                  {record.mimeType && (
                    <>
                      <span>-</span>
                      <span className="uppercase">{record.mimeType.split('/').pop()}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        ) : (
          <div className="text-center py-10 text-sm text-muted">No records match your search.</div>
        );
      })()}

      {previewRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewRecord(null)}
        >
          <div
            className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-card-border bg-card-bg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-foreground truncate">{previewRecord.name}</h2>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-muted">
                  {previewRecord.providerName && <span>{previewRecord.providerName}</span>}
                  {previewRecord.doctorName && <span>Dr. {previewRecord.doctorName}</span>}
                  {previewRecord.recordDate && (
                    <span>{format(parseISO(previewRecord.recordDate), 'MMM d, yyyy')}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPreviewRecord(null)}
                className="rounded-md p-1.5 text-muted hover:bg-card-border/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {isImage(previewRecord.mimeType) && (
                <div className="flex items-center justify-center">
                  <img
                    src={getAuthFileUrl(previewRecord.id)}
                    alt={previewRecord.name}
                    className="max-h-[60vh] max-w-full rounded-lg object-contain"
                  />
                </div>
              )}
              {isPdf(previewRecord.mimeType) && (
                <iframe
                  src={getAuthFileUrl(previewRecord.id)}
                  title={previewRecord.name}
                  className="h-[60vh] w-full rounded-lg border border-card-border"
                />
              )}
              {!isImage(previewRecord.mimeType) && !isPdf(previewRecord.mimeType) && (
                <div className="flex flex-col items-center justify-center py-12">
                  <File06 className="h-16 w-16 text-muted-light mb-4" />
                  <p className="text-sm text-muted mb-4">Preview not available for this file type</p>
                  <a
                    href={getAuthFileUrl(previewRecord.id)}
                    download
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                  >
                    Download File
                  </a>
                </div>
              )}

              {previewRecord.notes && (
                <div className="mt-6 rounded-lg border border-card-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Notes</p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{previewRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-card-border px-6 py-4">
              <div className="text-xs text-muted">
                {previewRecord.fileSize != null && formatFileSize(previewRecord.fileSize)}
                {previewRecord.mimeType && ` - ${previewRecord.mimeType}`}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (confirm('Delete this medical record?')) {
                      deleteMutation.mutate(previewRecord.id);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger/5 transition-colors"
                >
                  <Trash01 className="h-3.5 w-3.5" />
                  Delete
                </button>
                <a
                  href={getAuthFileUrl(previewRecord.id)}
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
