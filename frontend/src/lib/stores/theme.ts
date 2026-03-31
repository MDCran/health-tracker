'use client';

import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggle: () => void;
  hydrate: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  },

  toggle: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(next);
  },

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('theme') as Theme | null;
    const theme = stored || 'light';
    set({ theme });
    document.documentElement.classList.toggle('dark', theme === 'dark');
  },
}));
