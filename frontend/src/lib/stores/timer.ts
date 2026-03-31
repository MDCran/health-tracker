'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Timer {
  startedAt: number | null;
  elapsed: number;
  isRunning: boolean;
  type: 'stopwatch' | 'countdown';
  countdownFrom?: number;
}

interface TimerState {
  timers: Record<string, Timer>;
  createTimer: (id: string, type: 'stopwatch' | 'countdown', countdownFrom?: number) => void;
  startTimer: (id: string) => void;
  pauseTimer: (id: string) => void;
  resetTimer: (id: string) => void;
  removeTimer: (id: string) => void;
  getElapsed: (id: string) => number;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      timers: {},

      createTimer: (id, type, countdownFrom) => {
        if (get().timers[id]) return;
        set((state) => ({
          timers: {
            ...state.timers,
            [id]: { startedAt: null, elapsed: 0, isRunning: false, type, countdownFrom },
          },
        }));
      },

      startTimer: (id) => {
        set((state) => {
          const timer = state.timers[id];
          if (!timer || timer.isRunning) return state;
          return {
            timers: {
              ...state.timers,
              [id]: { ...timer, startedAt: Date.now(), isRunning: true },
            },
          };
        });
      },

      pauseTimer: (id) => {
        set((state) => {
          const timer = state.timers[id];
          if (!timer || !timer.isRunning) return state;
          const now = Date.now();
          const additional = timer.startedAt ? now - timer.startedAt : 0;
          return {
            timers: {
              ...state.timers,
              [id]: { ...timer, elapsed: timer.elapsed + additional, startedAt: null, isRunning: false },
            },
          };
        });
      },

      resetTimer: (id) => {
        set((state) => {
          const timer = state.timers[id];
          if (!timer) return state;
          return {
            timers: {
              ...state.timers,
              [id]: { ...timer, startedAt: null, elapsed: 0, isRunning: false },
            },
          };
        });
      },

      removeTimer: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.timers;
          return { timers: rest };
        });
      },

      getElapsed: (id) => {
        const timer = get().timers[id];
        if (!timer) return 0;
        if (!timer.isRunning) return timer.elapsed;
        return timer.elapsed + (Date.now() - (timer.startedAt ?? Date.now()));
      },
    }),
    {
      name: 'workout-timers',
    }
  )
);

export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
