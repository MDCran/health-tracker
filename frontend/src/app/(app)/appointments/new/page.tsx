'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Check } from '@untitled-ui/icons-react';
import { appointmentsApi } from '@/lib/api/appointments';

const SPECIALTIES = [
  'Primary Care', 'Family Medicine', 'Internal Medicine', 'Cardiology',
  'Dermatology', 'Endocrinology', 'Gastroenterology', 'Neurology',
  'Ophthalmology', 'Orthopedics', 'Psychiatry', 'Urology',
  'OB/GYN', 'Pediatrics', 'Physical Therapy', 'Dentist',
  'Optometrist', 'Other',
];

export default function NewAppointmentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [officeName, setOfficeName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [location, setLocation] = useState('');
  const [appointmentDate, setAppointmentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [appointmentTime, setAppointmentTime] = useState('09:00');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');

  const { data: existing } = useQuery({
    queryKey: ['appointment', editId],
    queryFn: () => appointmentsApi.get(Number(editId)),
    enabled: !!editId,
  });

  useEffect(() => {
    if (existing) {
      setTitle(existing.title || '');
      setDoctorName(existing.doctorName || '');
      setOfficeName(existing.officeName || '');
      setSpecialty(existing.specialty || '');
      setLocation(existing.location || '');
      setAppointmentDate(existing.appointmentDate);
      setAppointmentTime(existing.appointmentTime?.substring(0, 5) || '09:00');
      setDurationMinutes(existing.durationMinutes ? String(existing.durationMinutes) : '30');
      setNotes(existing.notes || '');
    }
  }, [existing]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      editId ? appointmentsApi.update(Number(editId), data) : appointmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      router.push('/appointments');
    },
  });

  function handleSave() {
    if (!title.trim() || !appointmentDate) return;
    createMutation.mutate({
      title: title.trim(),
      doctorName: doctorName.trim() || null,
      officeName: officeName.trim() || null,
      specialty: specialty || null,
      location: location.trim() || null,
      appointmentDate,
      appointmentTime: appointmentTime ? appointmentTime + ':00' : null,
      durationMinutes: durationMinutes ? Number(durationMinutes) : null,
      notes: notes.trim() || null,
      status: 'SCHEDULED',
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-8">
      <Link href="/appointments" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Appointments
      </Link>

      <h1 className="text-2xl font-bold text-foreground">{editId ? 'Edit' : 'New'} Appointment</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Title *</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Annual Physical, Blood Work, Dental Cleaning"
            className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Date *</label>
            <input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Time</label>
            <input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)}
              className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Duration (min)</label>
            <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="30"
              className="w-full rounded-lg border border-card-border bg-card-bg px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Doctor Name</label>
            <input type="text" value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Dr. Smith"
              className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Office / Clinic</label>
            <input type="text" value={officeName} onChange={(e) => setOfficeName(e.target.value)}
              placeholder="City Medical Center"
              className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Specialty</label>
          <select value={specialty} onChange={(e) => setSpecialty(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
            <option value="">Select specialty...</option>
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Location / Address</label>
          <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
            placeholder="123 Medical Dr, Suite 200"
            className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
            placeholder="Bring insurance card, list of medications, fasting required..."
            className="w-full rounded-lg border border-card-border bg-card-bg px-4 py-3 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>

        {createMutation.isError && (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
            Failed to save appointment. Please try again.
          </div>
        )}

        <button onClick={handleSave} disabled={!title.trim() || !appointmentDate || createMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors">
          {createMutation.isPending ? 'Saving...' : <><Check className="h-4 w-4" /> {editId ? 'Update' : 'Schedule'} Appointment</>}
        </button>
      </div>
    </div>
  );
}
