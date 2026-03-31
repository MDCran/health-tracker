'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, Check, Plus } from '@untitled-ui/icons-react';
import { habitsApi } from '@/lib/api/habits';
import { HABIT_CATEGORIES } from '@/types/habit';
import type { Habit } from '@/types/habit';

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'X per Week' },
  { value: 'MONTHLY', label: 'X per Month' },
];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

const PRESET_COLORS = [
  '#7c3aed', '#3b82f6', '#10b981', '#14b8a6',
  '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6',
  '#6366f1', '#06b6d4', '#84cc16', '#f97316',
];

const DIFFICULTY_OPTIONS = [
  { value: 'EASY', label: 'Easy', description: 'Takes minimal effort' },
  { value: 'MEDIUM', label: 'Medium', description: 'Requires some focus' },
  { value: 'HARD', label: 'Hard', description: 'Demands serious commitment' },
];

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Low' },
  { value: 2, label: 'Low-Med' },
  { value: 3, label: 'Medium' },
  { value: 4, label: 'Med-High' },
  { value: 5, label: 'High' },
];

const TARGET_PRESETS = [21, 30, 66, 90];

export default function NewHabitPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [habitType, setHabitType] = useState<'GOOD' | 'BAD'>('GOOD');
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [priority, setPriority] = useState<number>(3);

  const [cue, setCue] = useState('');
  const [routine, setRoutine] = useState('');
  const [reward, setReward] = useState('');

  const [frequency, setFrequency] = useState('DAILY');
  const [targetCount, setTargetCount] = useState(1);
  const [targetDays, setTargetDays] = useState(66);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [reminderTime, setReminderTime] = useState('');

  const [stackAfterHabitId, setStackAfterHabitId] = useState<number | null>(null);

  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [active, setActive] = useState(true);

  const { data: existingHabits } = useQuery({
    queryKey: ['habits-list-for-stacking'],
    queryFn: () => habitsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => habitsApi.create(data),
    onSuccess: () => {
      router.push('/habits');
    },
  });

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    createMutation.mutate({
      name: name.trim(),
      description: description.trim() || null,
      habitType,
      category: category || null,
      difficulty,
      priority,
      cue: cue.trim() || null,
      routine: routine.trim() || null,
      reward: reward.trim() || null,
      frequency,
      targetCount,
      targetDays,
      daysOfWeek: selectedDays,
      reminderTime: reminderTime || null,
      stackAfterHabitId,
      color,
      icon: null,
      active,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-12">
      <Link href="/habits" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Habits
      </Link>

      <h1 className="text-2xl font-bold text-foreground">New Habit</h1>

      <section className="space-y-2">
        <label className="block text-sm font-semibold text-foreground">What do you want to do?</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setHabitType('GOOD')}
            className={`rounded-xl px-5 py-4 text-left transition-all ${
              habitType === 'GOOD'
                ? 'bg-success/10 border-2 border-success shadow-sm'
                : 'border border-card-border hover:border-success/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Plus className={`h-5 w-5 ${habitType === 'GOOD' ? 'text-success' : 'text-muted'}`} />
              <span className={`text-sm font-semibold ${habitType === 'GOOD' ? 'text-success' : 'text-foreground'}`}>
                Build a Habit
              </span>
            </div>
            <p className="text-xs text-muted">
              Track daily completions and build consistency toward a positive routine.
            </p>
          </button>
          <button
            onClick={() => setHabitType('BAD')}
            className={`rounded-xl px-5 py-4 text-left transition-all ${
              habitType === 'BAD'
                ? 'bg-danger/10 border-2 border-danger shadow-sm'
                : 'border border-card-border hover:border-danger/50'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-lg leading-none ${habitType === 'BAD' ? 'text-danger' : 'text-muted'}`}>&times;</span>
              <span className={`text-sm font-semibold ${habitType === 'BAD' ? 'text-danger' : 'text-foreground'}`}>
                Break a Habit
              </span>
            </div>
            <p className="text-xs text-muted">
              Log occurrences and track progress toward eliminating a negative behavior.
            </p>
          </button>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-card-border bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Basic Info</h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={habitType === 'GOOD' ? 'e.g., Morning meditation' : 'e.g., Stop nail biting'}
            className="w-full rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional: describe what this habit entails..."
            rows={2}
            className="w-full rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">No category</option>
            {HABIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Difficulty</label>
          <div className="grid grid-cols-3 gap-2">
            {DIFFICULTY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDifficulty(opt.value)}
                className={`rounded-lg px-3 py-2.5 text-left transition-all ${
                  difficulty === opt.value
                    ? opt.value === 'EASY'
                      ? 'bg-success/10 border-2 border-success'
                      : opt.value === 'MEDIUM'
                        ? 'bg-warning/10 border-2 border-warning'
                        : 'bg-danger/10 border-2 border-danger'
                    : 'border border-card-border hover:border-primary/30'
                }`}
              >
                <p className={`text-sm font-semibold ${
                  difficulty === opt.value
                    ? opt.value === 'EASY' ? 'text-success' : opt.value === 'MEDIUM' ? 'text-warning' : 'text-danger'
                    : 'text-foreground'
                }`}>{opt.label}</p>
                <p className="text-[10px] text-muted mt-0.5">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
          <div className="flex gap-2">
            {PRIORITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPriority(opt.value)}
                className={`flex-1 rounded-lg px-2 py-2 text-center transition-colors ${
                  priority === opt.value
                    ? 'bg-primary text-white'
                    : 'border border-card-border text-muted hover:border-primary'
                }`}
              >
                <p className="text-sm font-semibold">{opt.value}</p>
                <p className={`text-[9px] ${priority === opt.value ? 'text-white/70' : 'text-muted'}`}>{opt.label}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-card-border bg-card-bg p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Habit Loop (Cue-Routine-Reward)</h2>
          <p className="text-xs text-muted mt-1">
            Based on &quot;The Power of Habit&quot; by Charles Duhigg. Define what triggers this habit, the action itself, and the reward you get.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Cue &mdash; What triggers this habit?
          </label>
          <textarea
            value={cue}
            onChange={(e) => setCue(e.target.value)}
            placeholder={habitType === 'GOOD'
              ? 'e.g., After my morning coffee is ready...'
              : 'e.g., When I feel stressed at work...'}
            rows={2}
            className="w-full rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Routine &mdash; What is the habit action?
          </label>
          <textarea
            value={routine}
            onChange={(e) => setRoutine(e.target.value)}
            placeholder={habitType === 'GOOD'
              ? 'e.g., Sit down and meditate for 10 minutes'
              : 'e.g., Reach for my phone and scroll social media'}
            rows={2}
            className="w-full rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Reward &mdash; What reward do you get?
          </label>
          <textarea
            value={reward}
            onChange={(e) => setReward(e.target.value)}
            placeholder={habitType === 'GOOD'
              ? 'e.g., Feeling of calm and mental clarity'
              : 'e.g., Temporary distraction / dopamine hit'}
            rows={2}
            className="w-full rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-card-border bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Schedule</h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Frequency</label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {FREQUENCY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {frequency !== 'DAILY' && (
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Target Count ({frequency === 'WEEKLY' ? 'per week' : 'per month'})
            </label>
            <input
              type="number"
              min={1}
              max={frequency === 'WEEKLY' ? 7 : 31}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
              className="w-32 rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Days of Week</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`h-10 w-12 rounded-lg text-sm font-medium transition-colors ${
                  selectedDays.includes(day.value)
                    ? 'bg-primary text-white'
                    : 'border border-card-border bg-sidebar-bg text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Days to {habitType === 'GOOD' ? 'Form' : 'Break'} Habit
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            {TARGET_PRESETS.map((d) => (
              <button
                key={d}
                onClick={() => setTargetDays(d)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  targetDays === d
                    ? 'bg-primary text-white'
                    : 'border border-card-border text-muted hover:border-primary'
                }`}
              >
                {d}d
              </button>
            ))}
            <input
              type="number"
              min={1}
              value={targetDays}
              onChange={(e) => setTargetDays(Number(e.target.value))}
              className="w-20 rounded-lg border border-card-border bg-sidebar-bg px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-muted">
            Research suggests ~21 days for simple habits, ~66 days on average for complex ones.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Reminder Time</label>
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="w-40 rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="mt-1 text-xs text-muted">Optional: set a daily reminder time.</p>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-card-border bg-card-bg p-5">
        <div>
          <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Habit Stacking</h2>
          <p className="text-xs text-muted mt-1">
            Pair this habit with an existing one to build a chain. After completing the linked habit, this one follows naturally.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Stack after another habit</label>
          <select
            value={stackAfterHabitId ?? ''}
            onChange={(e) => setStackAfterHabitId(e.target.value ? Number(e.target.value) : null)}
            className="w-full rounded-lg border border-card-border bg-sidebar-bg px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">None (standalone habit)</option>
            {existingHabits
              ?.filter((h) => h.active)
              .map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} {h.habitType === 'BAD' ? '(Break)' : '(Build)'}
                </option>
              ))}
          </select>
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-card-border bg-card-bg p-5">
        <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">Appearance</h2>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`h-9 w-9 rounded-full border-2 transition-transform ${
                  color === c ? 'border-foreground scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-card-border bg-sidebar-bg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Active</p>
            <p className="text-xs text-muted">Inactive habits won&apos;t appear in your daily checklist</p>
          </div>
          <button
            onClick={() => setActive(!active)}
            className={`relative h-6 w-11 rounded-full transition-colors ${active ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </section>

      {createMutation.isError && (
        <div className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          Failed to create habit. Please try again.
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!name.trim() || createMutation.isPending}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
      >
        {createMutation.isPending ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving...
          </>
        ) : (
          <>
            <Check className="h-4 w-4" />
            Save Habit
          </>
        )}
      </button>
    </div>
  );
}
