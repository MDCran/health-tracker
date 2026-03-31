'use client';

import { useState, useEffect } from 'react';
import { useTimerStore, formatTime } from '@/lib/stores/timer';

export function useTimer(timerId: string) {
  const timer = useTimerStore((s) => s.timers[timerId]);
  const { startTimer, pauseTimer, resetTimer } = useTimerStore();
  const [display, setDisplay] = useState('00:00');

  useEffect(() => {
    if (!timer) {
      setDisplay('00:00');
      return;
    }

    if (!timer.isRunning) {
      if (timer.type === 'countdown' && timer.countdownFrom) {
        const remaining = Math.max(0, timer.countdownFrom - timer.elapsed);
        setDisplay(formatTime(remaining));
      } else {
        setDisplay(formatTime(timer.elapsed));
      }
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const total = timer.elapsed + (now - (timer.startedAt ?? now));

      if (timer.type === 'countdown' && timer.countdownFrom) {
        const remaining = Math.max(0, timer.countdownFrom - total);
        setDisplay(formatTime(remaining));
        if (remaining <= 0) {
          pauseTimer(timerId);
        }
      } else {
        setDisplay(formatTime(total));
      }
    }, 100);

    return () => clearInterval(interval);
  }, [timer?.isRunning, timer?.startedAt, timer?.elapsed, timer?.type, timer?.countdownFrom, timerId, pauseTimer, timer]);

  return {
    display,
    isRunning: timer?.isRunning ?? false,
    start: () => startTimer(timerId),
    pause: () => pauseTimer(timerId),
    reset: () => resetTimer(timerId),
  };
}
