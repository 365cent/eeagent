import type { DefaultOptions } from '@tanstack/react-query'

/** Shared TanStack Query defaults for EEA server state (stale-while-revalidate on navigation). */
export const eeaQueryDefaultOptions: DefaultOptions = {
  queries: {
    staleTime: 0,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: 'always',
    retry: 1,
  },
}
