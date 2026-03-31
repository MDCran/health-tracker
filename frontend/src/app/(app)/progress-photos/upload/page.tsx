'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Upload01, Check, Image01 } from '@untitled-ui/icons-react';
import { photosApi } from '@/lib/api/photos';

export default function UploadPhotoPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [takenAt, setTakenAt] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [weightKg, setWeightKg] = useState('');
  const [notes, setNotes] = useState('');
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [leftArm, setLeftArm] = useState('');
  const [rightArm, setRightArm] = useState('');
  const [leftThigh, setLeftThigh] = useState('');
  const [rightThigh, setRightThigh] = useState('');
  const [shoulders, setShoulders] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('No file selected');
      const formData = new FormData();
      formData.append('file', file);
      if (takenAt) formData.append('takenAt', takenAt);
      if (weightKg) formData.append('weightKg', weightKg);
      if (notes) formData.append('notes', notes);
      if (chest) formData.append('chest', chest);
      if (waist) formData.append('waist', waist);
      if (hips) formData.append('hips', hips);
      if (leftArm) formData.append('leftArm', leftArm);
      if (rightArm) formData.append('rightArm', rightArm);
      if (leftThigh) formData.append('leftThigh', leftThigh);
      if (rightThigh) formData.append('rightThigh', rightThigh);
      if (shoulders) formData.append('shoulders', shoulders);
      return photosApi.upload(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-photos'] });
      router.push('/progress-photos');
    },
  });

  const measurementFields = [
    { label: 'Weight', value: weightKg, set: setWeightKg, unit: 'kg', full: true },
    { label: 'Chest', value: chest, set: setChest, unit: 'in' },
    { label: 'Shoulders', value: shoulders, set: setShoulders, unit: 'in' },
    { label: 'Waist', value: waist, set: setWaist, unit: 'in' },
    { label: 'Hips', value: hips, set: setHips, unit: 'in' },
    { label: 'Left Arm', value: leftArm, set: setLeftArm, unit: 'in' },
    { label: 'Right Arm', value: rightArm, set: setRightArm, unit: 'in' },
    { label: 'Left Thigh', value: leftThigh, set: setLeftThigh, unit: 'in' },
    { label: 'Right Thigh', value: rightThigh, set: setRightThigh, unit: 'in' },
  ];

  return (
    <div className="mx-auto max-w-xl space-y-6 pb-8">
      <div className="flex items-center gap-3">
        <Link href="/progress-photos" className="rounded-md p-1 text-muted hover:bg-card-border/50">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold text-foreground">Upload Progress Photo</h1>
      </div>

      <div
        onClick={() => fileRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed border-card-border bg-card-bg p-8 text-center hover:border-primary/50 transition-colors"
      >
        {preview ? (
          <div className="flex flex-col items-center gap-3">
            <img src={preview} alt="Preview" className="max-h-64 rounded-lg object-contain" />
            <p className="text-sm text-muted">{file?.name}</p>
            <p className="text-xs text-primary">Click to change photo</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-full bg-primary/10 p-4">
              <Image01 className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Click to select a photo</p>
              <p className="text-xs text-muted mt-1">JPG, PNG, or WebP up to 20MB</p>
            </div>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Photo Date</h2>
        <p className="text-xs text-muted mb-3">
          When was this photo taken?
        </p>
        <input
          type="date"
          value={takenAt}
          onChange={(e) => setTakenAt(e.target.value)}
          className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
        {takenAt && (
          <p className="mt-2 text-sm text-foreground">
            {format(new Date(takenAt + 'T00:00:00'), 'EEEE, MMMM d, yyyy')}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-card-border bg-card-bg p-6">
        <h2 className="text-sm font-semibold text-foreground mb-4">Measurements (optional)</h2>
        <p className="text-xs text-muted mb-4">
          Record your current measurements alongside this photo so you can see stats next to each image in the timeline.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {measurementFields.map(({ label, value, set, unit, full }) => (
            <div key={label} className={full ? 'col-span-2' : ''}>
              <label className="mb-1 block text-xs font-medium text-muted">{label}</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <span className="text-xs text-muted shrink-0">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-foreground">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes about this photo (e.g., post-workout, morning, etc.)"
          rows={2}
          className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
        />
      </div>

      {uploadMutation.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          Failed to upload photo. Please try again.
        </div>
      )}

      <button
        onClick={() => uploadMutation.mutate()}
        disabled={!file || uploadMutation.isPending}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
      >
        {uploadMutation.isPending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Uploading...
          </>
        ) : (
          <>
            <Upload01 className="h-4 w-4" />
            Upload Photo
          </>
        )}
      </button>
    </div>
  );
}
