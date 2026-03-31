'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Play,
  PauseCircle,
  StopCircle,
  Plus,
  Minus,
  Trash01,
  Check,
  Trophy01,
  Clock,
  X,
  SearchSm,
  ChevronDown,
  ChevronUp,
  InfoCircle,
} from '@untitled-ui/icons-react';
import { workoutApi, exerciseApi, prApi } from '@/lib/api/workouts';
import { profileApi } from '@/lib/api/auth';
import { useTimerStore, formatTime } from '@/lib/stores/timer';
import { format } from 'date-fns';
import type { Exercise, WorkoutSession, WorkoutExercise, ExerciseSet } from '@/types/workout';

interface LocalExercise {
  tempId: string;
  serverExerciseEntryId: number | null;
  exercise: Exercise;
  sets: LocalSet[];
  restTimerId: string | null;
  restCountdown: number;
}

interface LocalSet {
  tempId: string;
  serverSetId: number | null;
  setNumber: number;
  weightKg: string;
  reps: string;
  completed: boolean;
  isPR: boolean;
  previous: { weightKg: number | null; reps: number | null } | null;
}

const REST_PRESETS = [30, 60, 90, 120];

function cap(s: string | null | undefined): string {
  if (!s) return '';
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume');
  const queryClient = useQueryClient();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const [workoutName, setWorkoutName] = useState(`Workout - ${todayLabel}`);
  const [exercises, setExercises] = useState<LocalExercise[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Exercise[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const { data: profileData } = useQuery({ queryKey: ['profile'], queryFn: () => profileApi.get() });
  const isImperial = (profileData?.unitSystem ?? 'IMPERIAL') === 'IMPERIAL';
  const wUnit = isImperial ? 'lbs' : 'kg';
  const toKg = (displayVal: number) => isImperial ? displayVal / 2.20462 : displayVal;
  const fromKg = (kg: number) => isImperial ? Math.round(kg * 2.20462) : kg;
  const [collapsedExercises, setCollapsedExercises] = useState<Set<string>>(new Set());
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customEquipment, setCustomEquipment] = useState('');
  const [customTarget, setCustomTarget] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [infoExpanded, setInfoExpanded] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { timers, createTimer, startTimer, pauseTimer, resetTimer, removeTimer, getElapsed } = useTimerStore();
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(interval);
  }, []);

  const { data: personalRecords } = useQuery({
    queryKey: ['personal-records'],
    queryFn: () => prApi.list(),
  });

  function loadSessionIntoState(data: WorkoutSession) {
    setSession(data);
    setWorkoutName(data.name || `Workout - ${todayLabel}`);
    if (data.exercises && data.exercises.length > 0) {
      setExercises(data.exercises.map((ex: WorkoutExercise) => ({
        tempId: genId(),
        serverExerciseEntryId: ex.id,
        exercise: ex.exercise,
        sets: ex.sets.map((s: ExerciseSet) => ({
          tempId: genId(),
          serverSetId: s.id,
          setNumber: s.setNumber,
          weightKg: s.weightKg != null ? String(fromKg(s.weightKg)) : '',
          reps: s.reps != null ? String(s.reps) : '',
          completed: s.completed,
          isPR: false,
          previous: null,
        })),
        restTimerId: null,
        restCountdown: 0,
      })));
    }
    localStorage.setItem('active_workout_id', String(data.id));

    const existingTimer = useTimerStore.getState().timers['global'];
    if (existingTimer) {
    } else if (data.startedAt && !data.finishedAt) {
      const elapsedMs = Date.now() - new Date(data.startedAt).getTime();
      createTimer('global', 'stopwatch');
      useTimerStore.setState((state) => ({
        timers: {
          ...state.timers,
          global: { startedAt: Date.now(), elapsed: Math.max(0, elapsedMs), isRunning: true, type: 'stopwatch' as const },
        },
      }));
    } else {
      createTimer('global', 'stopwatch');
      startTimer('global');
    }
  }

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    if (resumeId) {
      workoutApi.get(Number(resumeId))
        .then((data) => {
          if (data) {
            loadSessionIntoState(data);
          } else {
            createNewSession();
          }
        })
        .catch(() => {
          createNewSession();
        });
    } else {
      const savedId = localStorage.getItem('active_workout_id');
      if (savedId) {
        workoutApi.get(Number(savedId))
          .then((data) => {
            if (data && !data.finishedAt) {
              loadSessionIntoState(data);
            } else {
              localStorage.removeItem('active_workout_id');
              createNewSession();
            }
          })
          .catch(() => {
            localStorage.removeItem('active_workout_id');
            createNewSession();
          });
      } else {
        createNewSession();
      }
    }

    return () => {
      removeTimer('global');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function createNewSession() {
    workoutApi.create({ name: `Workout - ${todayLabel}`, date: format(new Date(), 'yyyy-MM-dd') })
      .then(async (data) => {
        const started = await workoutApi.start(data.id);
        setSession(started);
        localStorage.setItem('active_workout_id', String(started.id));
        queryClient.invalidateQueries({ queryKey: ['workouts'] });
        createTimer('global', 'stopwatch');
        startTimer('global');
      })
      .catch(() => {
      });
  }

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      exerciseApi.autocomplete(searchQuery.trim()).then(setSearchResults).catch(() => setSearchResults([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const globalTimer = timers['global'];
  const globalElapsed = getElapsed('global');

  const handleAddExercise = useCallback(async (exercise: Exercise) => {
    if (!session) return;
    setSearchQuery('');
    setSearchResults([]);
    setShowSearch(false);

    const tempId = genId();
    const timerId = `ex-${tempId}`;
    createTimer(timerId, 'stopwatch');

    const newEx: LocalExercise = {
      tempId,
      serverExerciseEntryId: null,
      exercise,
      sets: [
        { tempId: genId(), serverSetId: null, setNumber: 1, weightKg: '', reps: '', completed: false, isPR: false, previous: null },
      ],
      restTimerId: null,
      restCountdown: 0,
    };

    setExercises((prev) => [...prev, newEx]);

    try {
      const result = await workoutApi.addExercise(session.id, { exerciseId: exercise.id, exerciseOrder: exercises.length + 1 });
      setExercises((prev) =>
        prev.map((e) => (e.tempId === tempId ? { ...e, serverExerciseEntryId: (result as { id: number }).id } : e))
      );
    } catch {
    }
  }, [session, exercises.length, createTimer]);

  const handleAddSet = (exTempId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.tempId !== exTempId) return ex;
        const nextNum = ex.sets.length + 1;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            { tempId: genId(), serverSetId: null, setNumber: nextNum, weightKg: '', reps: '', completed: false, isPR: false, previous: null },
          ],
        };
      })
    );
  };

  const handleSetChange = (exTempId: string, setTempId: string, field: 'weightKg' | 'reps', value: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.tempId !== exTempId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.tempId === setTempId ? { ...s, [field]: value } : s)),
        };
      })
    );
  };

  const handleToggleComplete = (exTempId: string, setTempId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.tempId !== exTempId) return ex;

        const updatedSets = ex.sets.map((s) => {
          if (s.tempId !== setTempId) return s;
          return { ...s, completed: !s.completed };
        });

        const completedSets = updatedSets.filter((s) => s.completed);
        const exPRs = personalRecords?.filter((pr) => pr.exerciseId === ex.exercise.id) ?? [];
        const currentMaxWeight = exPRs.find((pr) => pr.recordType === 'MAX_WEIGHT')?.value ?? 0;
        const currentMaxReps = exPRs.find((pr) => pr.recordType === 'MAX_REPS')?.value ?? 0;

        let bestWeightSetId: string | null = null;
        let bestWeight = currentMaxWeight;
        let bestRepsSetId: string | null = null;
        let bestReps = currentMaxReps;

        for (const s of completedSets) {
          const w = parseFloat(s.weightKg) || 0;
          const r = parseInt(s.reps) || 0;
          if (w > 0 && r >= 1 && w > bestWeight) {
            bestWeight = w;
            bestWeightSetId = s.tempId;
          }
          if (r > 0 && r > bestReps) {
            bestReps = r;
            bestRepsSetId = s.tempId;
          }
        }

        const prSetIds = new Set<string>();
        if (bestWeightSetId) prSetIds.add(bestWeightSetId);
        if (bestRepsSetId) prSetIds.add(bestRepsSetId);

        return {
          ...ex,
          sets: updatedSets.map((s) => ({
            ...s,
            isPR: s.completed && prSetIds.has(s.tempId),
          })),
        };
      })
    );
  };

  const handleRemoveExercise = async (exTempId: string) => {
    const ex = exercises.find((e) => e.tempId === exTempId);
    if (!ex) return;
    if (ex.restTimerId) removeTimer(ex.restTimerId);
    removeTimer(`ex-${exTempId}`);
    setExercises((prev) => prev.filter((e) => e.tempId !== exTempId));
    if (session && ex.serverExerciseEntryId) {
      try {
        await workoutApi.removeExercise(session.id, ex.serverExerciseEntryId);
      } catch {
      }
    }
  };

  const handleStartRest = (exTempId: string, seconds: number) => {
    const timerId = `rest-${exTempId}`;
    removeTimer(timerId);
    createTimer(timerId, 'countdown', seconds * 1000);
    startTimer(timerId);
    setExercises((prev) =>
      prev.map((ex) => (ex.tempId === exTempId ? { ...ex, restTimerId: timerId, restCountdown: seconds } : ex))
    );
  };

  const toggleCollapse = (exTempId: string) => {
    setCollapsedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(exTempId)) next.delete(exTempId);
      else next.add(exTempId);
      return next;
    });
  };

  function cleanupTimers() {
    localStorage.removeItem('active_workout_id');
    removeTimer('global');
    exercises.forEach((ex) => {
      removeTimer(`ex-${ex.tempId}`);
      if (ex.restTimerId) removeTimer(ex.restTimerId);
    });
  }

  const finishMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No session');

      for (const ex of exercises) {
        if (!ex.serverExerciseEntryId) continue;
        for (const s of ex.sets) {
          const displayWeight = parseFloat(s.weightKg) || null;
          const weight = displayWeight != null ? Math.round(toKg(displayWeight) * 100) / 100 : null;
          const reps = parseInt(s.reps) || null;
          if (!weight && !reps) continue;
          try {
            if (s.serverSetId) {
              await workoutApi.updateSet(session.id, ex.serverExerciseEntryId, s.serverSetId, {
                setNumber: s.setNumber, weightKg: weight, reps, completed: s.completed, setType: 'WORKING',
              });
            } else {
              await workoutApi.addSet(session.id, ex.serverExerciseEntryId, {
                setNumber: s.setNumber, weightKg: weight, reps, completed: s.completed, setType: 'WORKING',
              });
            }
          } catch { /* skip failed sets */ }
        }
      }

      const date = session.date || new Date().toISOString().split('T')[0];
      try { await workoutApi.update(session.id, { name: workoutName || 'Workout', date }); } catch { /* ok */ }

      return workoutApi.finish(session.id);
    },
    onSuccess: (data) => {
      cleanupTimers();
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      queryClient.invalidateQueries({ queryKey: ['personal-records'] });
      router.push(`/workouts/${data.id}`);
    },
    onError: (err) => {
      console.error('Finish workout error:', err);
      cleanupTimers();
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      router.push('/workouts');
    },
  });

  const discardMutation = useMutation({
    mutationFn: async () => {
      if (!session) throw new Error('No session');
      return workoutApi.delete(session.id);
    },
    onSuccess: () => {
      cleanupTimers();
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      router.push('/workouts');
    },
    onError: () => {
      cleanupTimers();
      router.push('/workouts');
    },
  });

  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const handleFinish = () => {
    pauseTimer('global');
    finishMutation.mutate();
  };

  const handleDiscard = () => {
    discardMutation.mutate();
  };

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted">Setting up your workout...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <input
        type="text"
        value={workoutName}
        onChange={(e) => setWorkoutName(e.target.value)}
        className="w-full bg-transparent text-2xl font-bold text-foreground border-none outline-none focus:outline-none placeholder:text-muted-light"
        placeholder="Workout name..."
      />

      <div className="rounded-lg border border-card-border bg-card-bg p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted uppercase tracking-wide mb-1">Workout Timer</p>
            <p className="font-mono text-4xl font-bold text-foreground tabular-nums tracking-tight">
              {formatTime(globalElapsed)}
            </p>
          </div>
          <div className="flex gap-2">
            {globalTimer?.isRunning ? (
              <button
                onClick={() => pauseTimer('global')}
                className="rounded-lg bg-warning/15 p-3 text-warning hover:bg-warning/25 transition-colors"
                title="Pause"
              >
                <PauseCircle className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => startTimer('global')}
                className="rounded-lg bg-success/15 p-3 text-success hover:bg-success/25 transition-colors"
                title="Resume"
              >
                <Play className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => resetTimer('global')}
              className="rounded-lg bg-muted-light/10 p-3 text-muted hover:bg-muted-light/20 transition-colors"
              title="Reset"
            >
              <StopCircle className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative" ref={searchRef}>
        <label className="block text-sm font-semibold text-foreground mb-2">Add Exercise</label>
        <div className="relative">
          <SearchSm className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            placeholder="Search exercises (e.g. bench press, squat...)"
            className="w-full rounded-lg border border-card-border bg-card-bg pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-light focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {showSearch && (searchResults.length > 0 || searchQuery.trim().length >= 2) && (
          <div className="absolute z-30 mt-1 w-full max-h-80 overflow-y-auto rounded-xl border border-card-border bg-card-bg shadow-xl">
            {searchQuery.trim().length >= 2 && !showCustomForm && (
              <button
                onClick={() => setShowCustomForm(true)}
                className="w-full text-left px-3 py-3 hover:bg-sidebar-bg transition-colors border-b border-card-border flex items-center gap-3"
              >
                <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">
                  Create &quot;{searchQuery.trim()}&quot;
                </span>
              </button>
            )}
            {showCustomForm && (
              <div className="p-3 border-b border-card-border space-y-2">
                <p className="text-xs font-semibold text-foreground">New: {searchQuery.trim()}</p>
                <input type="text" placeholder="Equipment (e.g. dumbbell, barbell, bodyweight)" value={customEquipment}
                  onChange={(e) => setCustomEquipment(e.target.value)}
                  className="w-full rounded border border-card-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" />
                <input type="text" placeholder="Target muscles (e.g. biceps, chest)" value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  className="w-full rounded border border-card-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none" />
                <textarea placeholder="Instructions / notes (optional)" value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)} rows={2}
                  className="w-full rounded border border-card-border bg-background px-2 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      const name = searchQuery.trim();
                      try {
                        const custom = await exerciseApi.createCustom({
                          name,
                          category: 'strength',
                          equipment: customEquipment.trim() || null,
                          targetMuscle: customTarget.trim() || null,
                          bodyPart: customTarget.trim() || null,
                          instructions: customInstructions.trim() ? [customInstructions.trim()] : [],
                        });
                        handleAddExercise(custom);
                      } catch {
                        handleAddExercise({ id: Date.now(), name, bodyPart: customTarget.trim() || null, targetMuscle: customTarget.trim() || null, equipment: customEquipment.trim() || null, gifUrl: null, category: 'strength' } as Exercise);
                      }
                      setShowCustomForm(false);
                      setCustomEquipment('');
                      setCustomTarget('');
                      setCustomInstructions('');
                    }}
                    className="rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-dark"
                  >
                    Add Exercise
                  </button>
                  <button onClick={() => setShowCustomForm(false)}
                    className="rounded border border-card-border px-3 py-1.5 text-xs text-muted hover:text-foreground">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {searchResults.map((ex) => (
              <button
                key={ex.id}
                onClick={() => handleAddExercise(ex)}
                className="w-full text-left px-3 py-3 hover:bg-sidebar-bg transition-colors border-b border-card-border last:border-0 flex items-start gap-3"
              >
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-foreground text-sm">{cap(ex.name)}</span>
                  {(ex.targetMuscle || ex.bodyPart) && (
                    <p className="text-xs text-muted mt-0.5">
                      {ex.targetMuscle && <><span className="text-success font-medium">{cap(ex.targetMuscle)}</span></>}
                      {ex.targetMuscle && ex.bodyPart && ex.bodyPart !== ex.targetMuscle && ' · '}
                      {ex.bodyPart && ex.bodyPart !== ex.targetMuscle && <span>{cap(ex.bodyPart)}</span>}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {ex.equipment && (
                      <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">{cap(ex.equipment)}</span>
                    )}
                    {ex.difficulty && (
                      <span className="rounded-full bg-info/10 px-2 py-0.5 text-[11px] font-medium text-info">{cap(ex.difficulty)}</span>
                    )}
                    {ex.mechanic && (
                      <span className="rounded-full bg-purple/10 px-2 py-0.5 text-[11px] font-medium text-purple">{cap(ex.mechanic)}</span>
                    )}
                  </div>
                </div>
                <div className="shrink-0 self-center">
                  <InfoCircle className="h-4 w-4 text-muted-light" />
                </div>
              </button>
            ))}
          </div>
        )}
        {showSearch && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-lg border border-card-border bg-card-bg p-4 text-sm text-muted shadow-lg">
            No exercises found for &quot;{searchQuery}&quot;
          </div>
        )}
      </div>

      {exercises.length === 0 && (
        <div className="rounded-lg border border-dashed border-card-border bg-card-bg p-10 text-center">
          <p className="text-muted">No exercises added yet. Search above to add exercises to your workout.</p>
        </div>
      )}

      {exercises.map((ex, exIdx) => {
        const isCollapsed = collapsedExercises.has(ex.tempId);
        const exTimerElapsed = getElapsed(`ex-${ex.tempId}`);
        const restTimer = ex.restTimerId ? timers[ex.restTimerId] : null;
        const restElapsed = ex.restTimerId ? getElapsed(ex.restTimerId) : 0;
        const restRemaining = restTimer?.countdownFrom ? Math.max(0, restTimer.countdownFrom - restElapsed) : 0;
        const restActive = restTimer?.isRunning && restRemaining > 0;

        return (
          <div key={ex.tempId} className="rounded-lg border border-card-border bg-card-bg overflow-hidden">
            <div className="flex items-center justify-between bg-sidebar-bg px-4 py-3 border-b border-card-border">
              <button onClick={() => toggleCollapse(ex.tempId)} className="flex items-center gap-2 flex-1 min-w-0">
                {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted shrink-0" /> : <ChevronUp className="h-4 w-4 text-muted shrink-0" />}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-foreground text-sm truncate">{cap(ex.exercise.name)}</h3>
                    <span
                      role="button"
                      onClick={(e) => { e.stopPropagation(); setInfoExpanded(prev => { const next = new Set(prev); next.has(ex.tempId) ? next.delete(ex.tempId) : next.add(ex.tempId); return next; }); }}
                      className="rounded p-0.5 text-muted hover:text-info hover:bg-info/10 cursor-pointer"
                      title="View exercise info"
                    >
                      <InfoCircle className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {ex.exercise.targetMuscle && (
                      <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">{cap(ex.exercise.targetMuscle)}</span>
                    )}
                    {ex.exercise.primaryMuscles?.filter(m => m !== ex.exercise.targetMuscle).map((m) => (
                      <span key={m} className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{cap(m)}</span>
                    ))}
                    {ex.exercise.equipment && (
                      <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-medium text-warning">{cap(ex.exercise.equipment)}</span>
                    )}
                  </div>
                </div>
              </button>
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <div className="text-right">
                  <p className="font-mono text-xs text-muted">{formatTime(exTimerElapsed)}</p>
                </div>
                <div className="flex gap-1">
                  {!timers[`ex-${ex.tempId}`]?.isRunning ? (
                    <button onClick={() => startTimer(`ex-${ex.tempId}`)} className="rounded p-1 text-success hover:bg-success/10" title="Start timer">
                      <Play className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button onClick={() => pauseTimer(`ex-${ex.tempId}`)} className="rounded p-1 text-warning hover:bg-warning/10" title="Pause timer">
                      <PauseCircle className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveExercise(ex.tempId)}
                  className="rounded p-1 text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  title="Remove exercise"
                >
                  <Trash01 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isCollapsed && (ex.exercise.targetMuscle || ex.exercise.equipment) && (
              <div className="flex items-center gap-3 border-b border-card-border bg-sidebar-bg/50 px-4 py-2">
                <div className="space-y-1 text-xs">
                  {ex.exercise.targetMuscle && <p><span className="text-muted">Target:</span> <span className="font-medium text-success">{cap(ex.exercise.targetMuscle)}</span></p>}
                  {ex.exercise.bodyPart && <p><span className="text-muted">Body Part:</span> <span className="font-medium text-foreground">{cap(ex.exercise.bodyPart)}</span></p>}
                  {ex.exercise.equipment && <p><span className="text-muted">Equipment:</span> <span className="font-medium text-warning">{cap(ex.exercise.equipment)}</span></p>}
                  {ex.exercise.secondaryMuscles && ex.exercise.secondaryMuscles.length > 0 && (
                    <p><span className="text-muted">Secondary:</span> <span className="font-medium text-foreground">{ex.exercise.secondaryMuscles.map(m => cap(m)).join(', ')}</span></p>
                  )}
                </div>
              </div>
            )}

            {infoExpanded.has(ex.tempId) && (
              <div className="border-b border-card-border bg-info/5 p-4 space-y-3">
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    {ex.exercise.bodyPart && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-muted">Body Part:</span>
                        <span className="font-medium text-foreground">{cap(ex.exercise.bodyPart)}</span>
                      </div>
                    )}
                    {ex.exercise.targetMuscle && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-muted">Target:</span>
                        <span className="font-medium text-foreground">{cap(ex.exercise.targetMuscle)}</span>
                      </div>
                    )}
                    {ex.exercise.secondaryMuscles && ex.exercise.secondaryMuscles.length > 0 && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-muted">Secondary:</span>
                        <span className="font-medium text-foreground">{ex.exercise.secondaryMuscles.map(m => cap(m)).join(', ')}</span>
                      </div>
                    )}
                    {ex.exercise.equipment && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-muted">Equipment:</span>
                        <span className="font-medium text-foreground">{cap(ex.exercise.equipment)}</span>
                      </div>
                    )}
                    {ex.exercise.difficulty && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-muted">Difficulty:</span>
                        <span className="font-medium text-foreground capitalize">{ex.exercise.difficulty}</span>
                      </div>
                    )}
                    {ex.exercise.source && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-muted">Source:</span>
                        <span className="font-medium text-muted-light">{ex.exercise.source}</span>
                      </div>
                    )}
                  </div>
                </div>
                {ex.exercise.instructions && ex.exercise.instructions.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1.5">Instructions</p>
                    <ol className="list-decimal list-inside space-y-1">
                      {ex.exercise.instructions.map((step, i) => (
                        <li key={i} className="text-xs text-muted leading-relaxed">{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {ex.exercise.videoUrls && ex.exercise.videoUrls.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-foreground mb-1">Videos</p>
                    <div className="flex gap-2 overflow-x-auto">
                      {ex.exercise.videoUrls.slice(0, 3).map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-info hover:underline shrink-0">
                          Video {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!isCollapsed && (
              <div className="p-4 space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted">
                        <th className="pb-2 text-left w-12">Set</th>
                        <th className="pb-2 text-center w-24">Previous</th>
                        <th className="pb-2 text-center w-28">Weight ({wUnit})</th>
                        <th className="pb-2 text-center w-24">Reps</th>
                        <th className="pb-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((s) => (
                        <tr key={s.tempId} className={s.completed ? 'bg-success/5' : ''}>
                          <td className="py-1.5 pr-2">
                            <span className="font-medium text-foreground">{s.setNumber}</span>
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span className="text-xs text-muted-light">
                              {s.previous ? `${s.previous.weightKg != null ? fromKg(s.previous.weightKg) : '-'}${wUnit} x ${s.previous.reps ?? '-'}` : '--'}
                            </span>
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <div className="inline-flex items-center h-8 rounded-lg border border-card-border bg-background">
                              <button type="button" onClick={() => { const step = isImperial ? 5 : 2.5; const v = Math.max(0, (parseFloat(s.weightKg) || 0) - step); handleSetChange(ex.tempId, s.tempId, 'weightKg', v.toString()); }} className="flex items-center justify-center w-7 h-full text-muted hover:bg-card-border/50 hover:text-foreground transition-colors border-r border-card-border"><Minus className="h-3 w-3" /></button>
                              <input
                                type="number"
                                value={s.weightKg}
                                onChange={(e) => handleSetChange(ex.tempId, s.tempId, 'weightKg', e.target.value)}
                                placeholder="0"
                                className="w-10 h-full bg-transparent text-center text-xs font-mono text-foreground focus:outline-none"
                              />
                              <button type="button" onClick={() => { const step = isImperial ? 5 : 2.5; const v = (parseFloat(s.weightKg) || 0) + step; handleSetChange(ex.tempId, s.tempId, 'weightKg', v.toString()); }} className="flex items-center justify-center w-7 h-full text-muted hover:bg-card-border/50 hover:text-foreground transition-colors border-l border-card-border"><Plus className="h-3 w-3" /></button>
                            </div>
                          </td>
                          <td className="py-1.5 px-1 text-center">
                            <div className="inline-flex items-center h-8 rounded-lg border border-card-border bg-background">
                              <button type="button" onClick={() => { const v = Math.max(0, (parseInt(s.reps) || 0) - 1); handleSetChange(ex.tempId, s.tempId, 'reps', v.toString()); }} className="flex items-center justify-center w-7 h-full text-muted hover:bg-card-border/50 hover:text-foreground transition-colors border-r border-card-border"><Minus className="h-3 w-3" /></button>
                              <input
                                type="number"
                                value={s.reps}
                                onChange={(e) => handleSetChange(ex.tempId, s.tempId, 'reps', e.target.value)}
                                placeholder="0"
                                className="w-8 h-full bg-transparent text-center text-xs font-mono text-foreground focus:outline-none"
                              />
                              <button type="button" onClick={() => { const v = (parseInt(s.reps) || 0) + 1; handleSetChange(ex.tempId, s.tempId, 'reps', v.toString()); }} className="flex items-center justify-center w-7 h-full text-muted hover:bg-card-border/50 hover:text-foreground transition-colors border-l border-card-border"><Plus className="h-3 w-3" /></button>
                            </div>
                          </td>
                          <td className="py-1.5 pl-2 text-center">
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={() => handleToggleComplete(ex.tempId, s.tempId)}
                                title={s.completed ? 'Set completed - click to undo' : 'Mark set as done'}
                                className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${s.completed ? 'bg-success text-white' : 'border border-card-border text-muted hover:border-success hover:text-success'}`}
                              >
                                {s.completed ? <><Check className="h-3 w-3 inline mr-0.5" /> Done</> : 'Done'}
                              </button>
                              {s.isPR && (
                                <span className="inline-flex items-center gap-0.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
                                  <Trophy01 className="h-2.5 w-2.5" /> PR!
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={() => handleAddSet(ex.tempId)}
                  className="w-full rounded-md border border-dashed border-card-border py-2 text-xs font-medium text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  + Add Set
                </button>

                <div className="flex items-center gap-2 pt-1">
                  <Clock className="h-3.5 w-3.5 text-muted shrink-0" />
                  <span className="text-xs text-muted shrink-0">Rest:</span>
                  {REST_PRESETS.map((sec) => (
                    <button
                      key={sec}
                      onClick={() => handleStartRest(ex.tempId, sec)}
                      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                        restActive && ex.restCountdown === sec
                          ? 'bg-primary text-white'
                          : 'bg-sidebar-bg text-muted hover:bg-card-border'
                      }`}
                    >
                      {sec}s
                    </button>
                  ))}
                  {restActive && (
                    <span className="font-mono text-sm font-semibold text-primary ml-auto tabular-nums">
                      {formatTime(restRemaining)}
                    </span>
                  )}
                  {restTimer && !restTimer.isRunning && restRemaining === 0 && ex.restTimerId && (
                    <span className="text-xs text-success font-medium ml-auto">Rest complete</span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-3 pt-4">
        {!showConfirmFinish ? (
          <button
            onClick={() => setShowConfirmFinish(true)}
            className="flex-1 rounded-lg bg-success px-6 py-3 text-sm font-semibold text-white hover:bg-success/90 transition-colors"
          >
            Finish Workout
          </button>
        ) : (
          <div className="flex-1 flex gap-2">
            <button
              onClick={handleFinish}
              disabled={finishMutation.isPending}
              className="flex-1 rounded-lg bg-success px-4 py-3 text-sm font-bold text-white hover:bg-success/90 disabled:opacity-50 transition-colors"
            >
              {finishMutation.isPending ? 'Saving...' : 'Yes, Finish'}
            </button>
            <button
              onClick={() => setShowConfirmFinish(false)}
              className="rounded-lg border border-card-border px-4 py-3 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {!showConfirmDiscard ? (
          <button
            onClick={() => setShowConfirmDiscard(true)}
            className="rounded-lg border border-danger/30 bg-danger/5 px-6 py-3 text-sm font-semibold text-danger hover:bg-danger/10 transition-colors"
          >
            Discard
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDiscard}
              disabled={discardMutation.isPending}
              className="rounded-lg bg-danger px-4 py-3 text-sm font-bold text-white hover:bg-danger/90 disabled:opacity-50 transition-colors"
            >
              {discardMutation.isPending ? 'Deleting...' : 'Yes, Discard'}
            </button>
            <button
              onClick={() => setShowConfirmDiscard(false)}
              className="rounded-lg border border-card-border px-4 py-3 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
