'use client';

import { create } from 'zustand';
import type { UserProfile, AuthResponse } from '@/types/profile';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (response: AuthResponse) => void;
  setUser: (user: UserProfile) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (response: AuthResponse) => {
    localStorage.setItem('auth_token', response.token);
    set({ token: response.token, isAuthenticated: true });
  },

  setUser: (user: UserProfile) => {
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      set({ token, isAuthenticated: true });
    }
  },
}));
