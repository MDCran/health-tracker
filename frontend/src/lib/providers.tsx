'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { useAuthStore } from '@/lib/stores/auth';
import { useThemeStore } from '@/lib/stores/theme';
import { authApi } from '@/lib/api/auth';

function AuthHydrator({ children }: { children: ReactNode }) {
  const { hydrate, isAuthenticated, setUser } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    useThemeStore.getState().hydrate();
    setReady(true);
  }, [hydrate]);

  useEffect(() => {
    if (isAuthenticated) {
      authApi.me().then(setUser).catch((err) => {
        if (err?.status === 401) {
          useAuthStore.getState().logout();
        }
      });
    }
  }, [isAuthenticated, setUser]);

  if (!ready) return null;
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>{children}</AuthHydrator>
    </QueryClientProvider>
  );
}
