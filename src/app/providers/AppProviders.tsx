import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@core/auth';
import { PwaPrompts } from '@shared/ui/PwaPrompts';

/**
 * Composition root. Everything here is wiring; the behaviour lives in `core/`.
 *
 * `useAuth` used to be defined in this file, which forced every screen needing
 * identity to import upwards from `modules/` into `app/` — the inversion the
 * dependency rule exists to prevent. It now lives in `@core/auth`; this file
 * only mounts it.
 */

/**
 * Defaults from CONVENTIONS.md §4.
 *
 * `staleTime` is 5 minutes rather than the documented 30 s: reads are billed
 * per document and this data changes on human timescales. It is no longer the
 * one-hour setting used while the app was read-only — writes are live now, so a
 * participant must see their own registration appear without a hard reload.
 * Mutations invalidate the keys they touch, so correctness never depends on
 * this number; only the cost of being briefly behind does.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,
      gcTime: 24 * 60 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: true,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <PwaPrompts />
      </AuthProvider>
    </QueryClientProvider>
  );
}
