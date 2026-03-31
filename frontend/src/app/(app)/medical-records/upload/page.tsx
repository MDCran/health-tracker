'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Upload01, File06 } from '@untitled-ui/icons-react';
import { medicalRecordsApi } from '@/lib/api/medical-records';

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.heic';

export default function UploadMedicalRecordPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [providerName, setProviderName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [recordDate, setRecordDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!name) {
        const baseName = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
        setName(baseName);
      }
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      if (!name.trim()) throw new Error('Name is required');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name.trim());
      if (providerName.trim()) formData.append('providerName', providerName.trim());
      if (doctorName.trim()) formData.append('doctorName', doctorName.trim());
      if (recordDate) formData.append('recordDate', recordDate);
      if (notes.trim()) formData.append('notes', notes.trim());
      return medicalRecordsApi.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medical-records'] });
      router.push('/medical-records');
    },
  });

  const isImage = file && file.type.startsWith('image/');

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/medical-records" className="rounded-md p-1 text-muted hover:bg-card-border/50">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Upload Medical Record</h1>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-card-border bg-card-bg p-8 text-center hover:border-primary/50 transition-colors"
      >
        {file ? (
          <div className="flex flex-col items-center gap-3">
            {isImage ? (
              <img
                src={URL.createObjectURL(file)}
                alt="Preview"
                className="max-h-48 rounded-lg object-contain"
              />
            ) : (
              <div className="rounded-full bg-primary/10 p-4">
                <File06 className="h-8 w-8 text-primary" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted mt-0.5">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <p className="text-xs text-primary">Click to change file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-4">
              <File06 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Click to select a file</p>
              <p className="text-xs text-muted mt-1">PDF, images, or documents up to 50MB</p>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED_TYPES}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">
          Record Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Blood Work Results, X-Ray Report"
          className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Provider Details (optional)</h2>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Provider / Facility</label>
          <input
            type="text"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            placeholder="e.g., General Hospital, Quest Diagnostics"
            className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Doctor Name</label>
          <input
            type="text"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
            placeholder="e.g., Dr. Smith"
            className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Record Date</label>
        <input
          type="date"
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {recordDate && (
          <p className="mt-1.5 text-xs text-muted">
            {format(new Date(recordDate + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional notes about this record..."
          rows={3}
          className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {uploadMutation.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {uploadMutation.error instanceof Error
            ? uploadMutation.error.message
            : 'Failed to upload record. Please try again.'}
        </div>
      )}

      <button
        onClick={() => uploadMutation.mutate()}
        disabled={!file || !name.trim() || uploadMutation.isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        {uploadMutation.isPending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Uploading...
          </>
        ) : (
          <>
            <Upload01 className="h-4 w-4" />
            Upload Record
          </>
        )}
      </button>
    </div>
  );
}
